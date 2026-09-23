package main

import (
	"fmt"
	"strings"
	"time"

	"github.com/gosnmp/gosnmp"
)

// Standard RFC 3805 OID — works on all printers
const oidTotalPages = ".1.3.6.1.2.1.43.10.2.1.4.1.1"

// Toner level OIDs (RFC 3805 / Printer MIB)
const (
	oidTonerLevel    = ".1.3.6.1.2.1.43.11.1.1.9"  // prtMarkerSuppliesLevel (current)
	oidTonerMax      = ".1.3.6.1.2.1.43.11.1.1.8"  // prtMarkerSuppliesMaxCapacity
	oidTonerColor    = ".1.3.6.1.2.1.43.12.1.1.4"  // prtMarkerColorantValue (color name)
	oidTonerDesc     = ".1.3.6.1.2.1.43.11.1.1.6"  // prtMarkerSuppliesDescription
)

// Brand-specific mono/color OIDs
var brandOIDs = map[string][2]string{
	"hp":      {".1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6", ".1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7"},
	"xerox":   {".1.3.6.1.4.1.253.8.74.1.2.3.1.1.6", ".1.3.6.1.4.1.253.8.74.1.2.3.1.1.7"},
	"canon":   {".1.3.6.1.4.1.1602.1.11.1.3.1.4.109", ".1.3.6.1.4.1.1602.1.11.1.3.1.4.106"},
	"ricoh":   {".1.3.6.1.4.1.367.3.2.1.2.19.2.0", ".1.3.6.1.4.1.367.3.2.1.2.19.1.0"},
	"brother": {".1.3.6.1.4.1.2435.2.3.9.4.2.1.5.1.2.63.23", ".1.3.6.1.4.1.2435.2.3.9.4.2.1.5.1.2.63.24"},
	"lexmark": {".1.3.6.1.4.1.641.2.1.5.2", ".1.3.6.1.4.1.641.2.1.5.3"},
	"konica":  {".1.3.6.1.4.1.18334.1.1.1.5.7.2.2.1.5.1.2", ".1.3.6.1.4.1.18334.1.1.1.5.7.2.2.1.5.2.2"},
}

type reading struct {
	PrinterID  int    `json:"printer_id"`
	TotalPages int64  `json:"total_pages"`
	MonoPages  int64  `json:"mono_pages"`
	ColorPages int64  `json:"color_pages"`
	ReadAt     string `json:"read_at"`
}

type tonerLevel struct {
	Color   string `json:"color"`
	Current int    `json:"current"`
	Max     int    `json:"max"`
}

type tonerReading struct {
	PrinterID  int          `json:"printer_id"`
	TonerLevels []tonerLevel `json:"toner_levels"`
}

func newSNMPClient(device DeviceConfig) (*gosnmp.GoSNMP, error) {
	client := &gosnmp.GoSNMP{
		Target:    device.IP,
		Port:      161,
		Community: device.Community,
		Version:   gosnmp.Version2c,
		Timeout:   time.Duration(5) * time.Second,
		Retries:   2,
	}
	if err := client.Connect(); err != nil {
		return nil, fmt.Errorf("snmp connect %s: %w", device.IP, err)
	}
	return client, nil
}

func pollDevice(device DeviceConfig) (*reading, error) {
	client, err := newSNMPClient(device)
	if err != nil {
		return nil, err
	}
	defer client.Conn.Close()

	oids := []string{oidTotalPages}
	brand := device.Brand
	if brand != "" {
		if ids, ok := brandOIDs[brand]; ok {
			oids = append(oids, ids[0], ids[1])
		}
	}

	result, err := client.Get(oids)
	if err != nil {
		return nil, fmt.Errorf("snmp get %s: %w", device.IP, err)
	}

	r := &reading{
		PrinterID:  device.PrinterID,
		ReadAt:     time.Now().UTC().Format(time.RFC3339),
	}

	for _, v := range result.Variables {
		val := snmpToInt64(v)
		switch v.Name {
		case oidTotalPages:
			r.TotalPages = val
		default:
			if brand != "" {
				if ids, ok := brandOIDs[brand]; ok {
					switch v.Name {
					case ids[0]:
						r.MonoPages = val
					case ids[1]:
						r.ColorPages = val
					}
				}
			}
		}
	}

	return r, nil
}

func pollTonerLevels(device DeviceConfig) (*tonerReading, error) {
	client, err := newSNMPClient(device)
	if err != nil {
		return nil, err
	}
	defer client.Conn.Close()

	// Walk current levels to discover all cartridges
	var levels []tonerLevel
	seen := make(map[string]bool)

	err = client.Walk(oidTonerLevel, func(pdu gosnmp.SnmpPDU) error {
		// Extract index from OID (e.g., ".1.3.6.1.2.1.43.11.1.1.9.1.1" → index "1")
		idx := strings.TrimPrefix(pdu.Name, oidTonerLevel+".")
		if idx == "" || seen[idx] {
			return nil
		}
		seen[idx] = true

		current := int(snmpToInt64(pdu))
		if current < 0 {
			return nil // -1 or -2 means unknown/not applicable
		}

		levels = append(levels, tonerLevel{
			Current: current,
			Max:     100, // default
		})

		return nil
	})
	if err != nil || len(levels) == 0 {
		return nil, fmt.Errorf("no toner cartridges found at %s", device.IP)
	}

	// For each discovered cartridge, get max capacity and color name
	for i := range levels {
		idx := fmt.Sprintf("%d", i+1)

		// Get max capacity
		maxOid := oidTonerMax + "." + idx
		if maxResult, err := client.Get([]string{maxOid}); err == nil {
			for _, v := range maxResult.Variables {
				if maxVal := snmpToInt64(v); maxVal > 0 {
					levels[i].Max = int(maxVal)
				}
			}
		}

		// Get color name
		colorOid := oidTonerColor + "." + idx
		if colorResult, err := client.Get([]string{colorOid}); err == nil {
			for _, v := range colorResult.Variables {
				if str, ok := v.Value.([]byte); ok {
					levels[i].Color = strings.ToLower(strings.TrimSpace(string(str)))
				}
			}
		}

		// Fallback color names by index if not reported
		if levels[i].Color == "" {
			switch idx {
			case "1":
				levels[i].Color = "black"
			case "2":
				levels[i].Color = "cyan"
			case "3":
				levels[i].Color = "magenta"
			case "4":
				levels[i].Color = "yellow"
			default:
				levels[i].Color = fmt.Sprintf("slot-%s", idx)
			}
		}
	}

	return &tonerReading{
		PrinterID:   device.PrinterID,
		TonerLevels: levels,
	}, nil
}

func snmpToInt64(v gosnmp.SnmpPDU) int64 {
	switch value := v.Value.(type) {
	case int:
		return int64(value)
	case int64:
		return value
	case uint:
		return int64(value)
	case uint64:
		return int64(value)
	}
	return 0
}
