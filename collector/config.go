package main

import (
	"fmt"

	"github.com/spf13/viper"
)

type DeviceConfig struct {
	IP        string `mapstructure:"ip"`
	PrinterID int    `mapstructure:"printer_id"`
	Community string `mapstructure:"community"`
}

type Config struct {
	CollectorName        string         `mapstructure:"collector_name"`
	APIEndpoint          string         `mapstructure:"api_endpoint"`
	APIToken             string         `mapstructure:"api_token"`
	PollInterval         int            `mapstructure:"poll_interval_seconds"`
	HeartbeatInterval    int            `mapstructure:"heartbeat_interval_seconds"`
	DBPath               string         `mapstructure:"db_path"`
	UploadBatchSize      int            `mapstructure:"upload_batch_size"`
	Devices              []DeviceConfig `mapstructure:"devices"`
}

func loadConfig() (*Config, error) {
	v := viper.New()
	v.SetConfigName("config")
	v.SetConfigType("yaml")
	v.AddConfigPath(".")

	v.SetDefault("collector_name", "collector-1")
	v.SetDefault("poll_interval_seconds", 3600)
	v.SetDefault("heartbeat_interval_seconds", 300)
	v.SetDefault("db_path", "readings.db")
	v.SetDefault("upload_batch_size", 50)

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}

	envKeys := []string{
		"collector_name", "api_endpoint", "api_token",
		"poll_interval_seconds", "heartbeat_interval_seconds",
		"db_path", "upload_batch_size",
	}
	for _, key := range envKeys {
		v.BindEnv(key)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	if cfg.APIEndpoint == "" {
		return nil, fmt.Errorf("api_endpoint is required")
	}
	if cfg.APIToken == "" {
		return nil, fmt.Errorf("api_token is required")
	}
	if len(cfg.Devices) == 0 {
		return nil, fmt.Errorf("at least one device is required")
	}

	for i, d := range cfg.Devices {
		if d.IP == "" {
			return nil, fmt.Errorf("device[%d]: ip is required", i)
		}
		if d.PrinterID == 0 {
			return nil, fmt.Errorf("device[%d]: printer_id is required", i)
		}
		if d.Community == "" {
			cfg.Devices[i].Community = "public"
		}
	}

	return &cfg, nil
}
