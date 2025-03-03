package util

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Location struct {
	Latitude  string `json:"latitude"`
	Longitude string `json:"longitude"`
}

// getLocation fetches the device's approximate location based on IP address
func GetLocation() (Location, error) {
	resp, err := http.Get("https://ipinfo.io/json")
	if err != nil {
		return Location{}, fmt.Errorf("failed to request location: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Location{}, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var data struct {
		Loc string `json:"loc"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return Location{}, fmt.Errorf("failed to decode JSON response: %v", err)
	}

	if data.Loc == "" {
		return Location{}, fmt.Errorf("location not found")
	}

	var loc Location
	fmt.Sscanf(data.Loc, "%s,%s", &loc.Latitude, &loc.Longitude)

	return loc, nil
}
