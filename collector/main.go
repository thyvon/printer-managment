package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go.etcd.io/bbolt"
)

const version = "1.0.0"

func main() {
	log.SetPrefix("[collector] ")
	log.SetFlags(log.Ldate | log.Ltime | log.Lmsgprefix)

	cfg, err := loadConfig()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	db, err := bbolt.Open(cfg.DBPath, 0600, nil)
	if err != nil {
		log.Fatalf("open db: %v", err)
	}
	defer db.Close()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	pollTicker := time.NewTicker(time.Duration(cfg.PollInterval) * time.Second)
	defer pollTicker.Stop()

	heartbeatTicker := time.NewTicker(time.Duration(cfg.HeartbeatInterval) * time.Second)
	defer heartbeatTicker.Stop()

	log.Printf("starting collector %q (v%s)", cfg.CollectorName, version)
	log.Printf("polling %d device(s) every %ds", len(cfg.Devices), cfg.PollInterval)
	log.Printf("heartbeat every %ds", cfg.HeartbeatInterval)

	sendHeartbeat(cfg, version)

	go func() {
		for range heartbeatTicker.C {
			if err := sendHeartbeat(cfg, version); err != nil {
				log.Printf("heartbeat failed: %v", err)
			} else {
				log.Printf("heartbeat sent")
			}
		}
	}()

	pollAndBuffer(cfg, db)

	for {
		select {
		case <-stop:
			log.Printf("shutting down")
			drainRemaining(cfg, db)
			return
		case <-pollTicker.C:
			pollAndBuffer(cfg, db)
		}
	}
}

func pollAndBuffer(cfg *Config, db *bbolt.DB) {
	for _, device := range cfg.Devices {
		r, err := pollDevice(device)
		if err != nil {
			log.Printf("poll %s failed: %v", device.IP, err)
			continue
		}

		if err := bufferReading(db, r); err != nil {
			log.Printf("buffer failed for %s: %v", device.IP, err)
			continue
		}
		log.Printf("buffered: printer=%d total=%d mono=%d color=%d", r.PrinterID, r.TotalPages, r.MonoPages, r.ColorPages)
	}

	drainBufferedReadings(cfg, db)
}

func drainBufferedReadings(cfg *Config, db *bbolt.DB) {
	count, err := bufferedCount(db)
	if err != nil || count == 0 {
		return
	}

	log.Printf("draining %d buffered reading(s)", count)

	for {
		keys, readings, err := loadBufferedReadings(db, cfg.UploadBatchSize)
		if err != nil || len(readings) == 0 {
			break
		}

		if err := drainBuffer(cfg, readings); err != nil {
			log.Printf("drain failed: %v (readings remain in buffer)", err)
			break
		}

		if err := deleteBufferedReadings(db, keys); err != nil {
			log.Printf("cleanup failed: %v", err)
			break
		}

		log.Printf("uploaded %d reading(s)", len(readings))

		remaining, _ := bufferedCount(db)
		if remaining == 0 {
			break
		}
	}
}

func drainRemaining(cfg *Config, db *bbolt.DB) {
	count, err := bufferedCount(db)
	if err != nil || count == 0 {
		return
	}

	log.Printf("draining %d remaining reading(s) before shutdown", count)
	drainBufferedReadings(cfg, db)
}
