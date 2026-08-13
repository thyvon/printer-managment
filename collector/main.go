package main

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gosnmp/gosnmp"
	"github.com/spf13/viper"
	"go.etcd.io/bbolt"
)

type Config struct {
	DeviceAddress string `mapstructure:"device_address"`
	Community     string `mapstructure:"community"`
	PollInterval  int    `mapstructure:"poll_interval_seconds"`
	APIEndpoint   string `mapstructure:"api_endpoint"`
	APIToken      string `mapstructure:"api_token"`
	DBPath        string `mapstructure:"db_path"`
}

func loadConfig() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")
	v.SetDefault("community", "public")
	v.SetDefault("poll_interval_seconds", 3600)
	v.SetDefault("db_path", "readings.db")

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, err
		}
	}

	for _, key := range []string{"device_address", "community", "poll_interval_seconds", "api_endpoint", "api_token", "db_path"} {
		v.BindEnv(key)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

// The standard SNMP MIB OIDs used across printer vendors for page counters.
// These are the proven, cross-vendor OIDs referenced in the project proposal.
const (
	oidTotalPages   = ".1.3.6.1.2.1.43.10.2.1.4.1.1" // prtMarkerLifeCount
	oidMonoPages    = ".1.3.6.1.4.1.253.8.74.1.2.3.1.1.6"
	oidColorPages   = ".1.3.6.1.4.1.253.8.74.1.2.3.1.1.7"
)

type reading struct {
	Device      string `json:"device"`
	CollectorID string `json:"collector_id"`
	TotalCount  int64  `json:"total_count"`
	CollectedAt string `json:"collected_at"`
}

func pollDevice(cfg *Config) (*reading, error) {
	params := &gosnmp.GoSNMP{
		Target:   cfg.DeviceAddress,
		Port:     161,
		Community: cfg.Community,
		Version:  gosnmp.Version2c,
		Timeout:  time.Duration(5) * time.Second,
		Retries:  2,
	}
	if err := params.Connect(); err != nil {
		return nil, err
	}
	defer params.Conn.Close()

	result, err := params.Get([]string{oidTotalPages})
	if err != nil {
		return nil, err
	}

	var count int64
	for _, v := range result.Variables {
		if v.Type == gosnmp.Counter32 || v.Type == gosnmp.Gauge32 {
			count = valueToInt64(v)
		}
	}

	return &reading{
		Device:      cfg.DeviceAddress,
		CollectorID: cfg.APIToken,
		TotalCount:  count,
		CollectedAt: time.Now().UTC().Format(time.RFC3339),
	}, nil
}

func valueToInt64(v gosnmp.SnmpPDU) int64 {
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

func bufferReading(db *bbolt.DB, r *reading) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists([]byte("readings"))
		if err != nil {
			return err
		}
		payload, err := json.Marshal(r)
		if err != nil {
			return err
		}
		return b.Put([]byte(time.Now().UTC().Format(time.RFC3339Nano)), payload)
	})
}

func main() {
	log.SetPrefix("[collector] ")
	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	if cfg.DeviceAddress == "" {
		log.Fatal("device_address is required in config")
	}

	db, err := bbolt.Open(cfg.DBPath, 0600, nil)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	log.Printf("starting poll loop for %s every %ds", cfg.DeviceAddress, cfg.PollInterval)
	for {
		r, err := pollDevice(cfg)
		if err != nil {
			log.Printf("poll failed: %v", err)
		} else {
			if err := bufferReading(db, r); err != nil {
				log.Printf("buffer failed: %v", err)
			} else {
				log.Printf("buffered reading: total=%d at %s", r.TotalCount, r.CollectedAt)
			}
		}
		time.Sleep(time.Duration(cfg.PollInterval) * time.Second)
	}
}