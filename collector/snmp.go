package main

import (
	"fmt"
	"time"

	"github.com/gosnmp/gosnmp"
)

// Standard RFC 3805 OID — works on all printers
const oidTotalPages = ".1.3.6.1.2.1.43.10.2.1.4.1.1"

// Brand-specific mono/color OIDs
var brandOIDs = map[string][2]string{
	// HP LaserJet / OfficeJet
	"hp": {
		".1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6", // mono
		".1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7", // color
	},
	// Xerox WorkCentre / Phaser
	"xerox": {
		".1.3.6.1.4.1.253.8.74.1.2.3.1.1.6", // mono
		".1.3.6.1.4.1.253.8.74.1.2.3.1.1.7", // color
	},
	// Canon imageRUNNER / imageCLASS
	"canon": {
		".1.3.6.1.4.1.1602.1.11.1.3.1.4.109", // mono (B/W)
		".1.3.6.1.4.1.1602.1.11.1.3.1.4.106", // color
	},
	// Ricoh Aficio / IM / MP
	"ricoh": {
		".1.3.6.1.4.1.367.3.2.1.2.19.2.0", // printer mode (mono)
		".1.3.6.1.4.1.367.3.2.1.2.19.1.0", // total (fallback)
	},
	// Brother HL / MFC / DCP
	"brother": {
		".1.3.6.1.4.1.2435.2.3.9.4.2.1.5.1.2.63.23", // mono
		".1.3.6.1.4.1.2435.2.3.9.4.2.1.5.1.2.63.24", // color
	},
	// Lexmark
	"lexmark": {
		".1.3.6.1.4.1.641.2.1.5.2", // mono
		".1.3.6.1.4.1.641.2.1.5.3", // color
	},
	// Konica Minolta bizhub
	"konica": {
		".1.3.6.1.4.1.18334.1.1.1.5.7.2.2.1.5.1.2", // mono printouts
		".1.3.6.1.4.1.18334.1.1.1.5.7.2.2.1.5.2.2", // color printouts
	},
}

type reading struct {
	PrinterID  int    `json:"printer_id"`
	TotalPages int64  `json:"total_pages"`
	MonoPages  int64  `json:"mono_pages"`
	ColorPages int64  `json:"color_pages"`
	ReadAt     string `json:"read_at"`
}

func pollDevice(device DeviceConfig) (*reading, error) {
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
	defer client.Conn.Close()

	// Build OID list: always total, plus brand-specific mono/color
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
