package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type heartbeatRequest struct {
	Version string `json:"version"`
}

type readingsRequest struct {
	Readings []*reading `json:"readings"`
}

type apiResponse struct {
	Message string `json:"message"`
	Count   int    `json:"count,omitempty"`
}

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        5,
		MaxIdleConnsPerHost: 5,
		IdleConnTimeout:     90 * time.Second,
	},
}

func sendHeartbeat(cfg *Config, version string) error {
	body := heartbeatRequest{Version: version}
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal heartbeat: %w", err)
	}

	url := cfg.APIEndpoint + "/api/collector/heartbeat"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create heartbeat request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIToken)

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send heartbeat: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("heartbeat failed: %d %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func sendReadings(cfg *Config, readings []*reading) error {
	if len(readings) == 0 {
		return nil
	}

	body := readingsRequest{Readings: readings}
	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal readings: %w", err)
	}

	url := cfg.APIEndpoint + "/api/collector/readings"
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create readings request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+cfg.APIToken)

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send readings: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("readings failed: %d %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func drainBuffer(cfg *Config, readings []*reading) error {
	const maxRetries = 3
	const retryDelay = 5 * time.Second

	var err error
	for attempt := 0; attempt < maxRetries; attempt++ {
		err = sendReadings(cfg, readings)
		if err == nil {
			return nil
		}
		log.Printf("upload attempt %d/%d failed: %v", attempt+1, maxRetries, err)
		if attempt < maxRetries-1 {
			time.Sleep(retryDelay)
		}
	}
	return fmt.Errorf("upload failed after %d retries: %w", maxRetries, err)
}
