package main

import (
	"encoding/json"
	"fmt"
	"time"

	"go.etcd.io/bbolt"
)

var readingsBucket = []byte("readings")

func bufferReading(db *bbolt.DB, r *reading) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b, err := tx.CreateBucketIfNotExists(readingsBucket)
		if err != nil {
			return err
		}
		payload, err := json.Marshal(r)
		if err != nil {
			return err
		}
		key := []byte(time.Now().UTC().Format(time.RFC3339Nano))
		return b.Put(key, payload)
	})
}

func loadBufferedReadings(db *bbolt.DB, limit int) ([][]byte, []*reading, error) {
	var keys [][]byte
	var readings []*reading

	err := db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(readingsBucket)
		if b == nil {
			return nil
		}
		c := b.Cursor()
		count := 0
		for k, v := c.First(); k != nil && count < limit; k, v = c.Next() {
			var r reading
			if err := json.Unmarshal(v, &r); err != nil {
				continue
			}
			keys = append(keys, k)
			readings = append(readings, &r)
			count++
		}
		return nil
	})

	return keys, readings, err
}

func deleteBufferedReadings(db *bbolt.DB, keys [][]byte) error {
	return db.Update(func(tx *bbolt.Tx) error {
		b := tx.Bucket(readingsBucket)
		if b == nil {
			return nil
		}
		for _, k := range keys {
			if err := b.Delete(k); err != nil {
				return fmt.Errorf("delete key %s: %w", k, err)
			}
		}
		return nil
	})
}

func bufferedCount(db *bbolt.DB) (int, error) {
	var count int
	err := db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(readingsBucket)
		if b == nil {
			return nil
		}
		count = b.Stats().KeyN
		return nil
	})
	return count, err
}
