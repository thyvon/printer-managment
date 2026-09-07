package main

import (
	"fmt"
	"time"

	"github.com/gosnmp/gosnmp"
)

const (
	oidTotalPages = ".1.3.6.1.2.1.43.10.2.1.4.1.1" // prtMarkerLifeCount (RFC 3805)
	oidMonoPages  = ".1.3.6.1.4.1.253.8.74.1.2.3.1.1.6" // Xerox mono counter
	oidColorPages = ".1.3.6.1.4.1.253.8.74.1.2.3.1.1.7" // Xerox color counter
)

type reading struct {
	PrinterID  int    `json:"printer_id"`
	TotalPages int64  `json:"total_pages"`
	MonoPages  int64  `json:"mono_pages"`
	ColorPages int64  `json:"color_pages"`
	ReadAt     string `json:"read_at"`
}

func pollDevice(device DeviceConfig) (*reading, error) {
	client := &gosnmp.GoSNMP{
		Target:   device.IP,
		Port:     161,
		Community: device.Community,
		Version:  gosnmp.Version2c,
		Timeout:  time.Duration(5) * time.Second,
		Retries:  2,
	}
	if err := client.Connect(); err != nil {
		return nil, fmt.Errorf("snmp connect %s: %w", device.IP, err)
	}
	defer client.Conn.Close()

	result, err := client.Get([]string{oidTotalPages, oidMonoPages, oidColorPages})
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
		case oidMonoPages:
			r.MonoPages = val
		case oidColorPages:
			r.ColorPages = val
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
