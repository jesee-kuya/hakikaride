package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

// global variable for database connection
var DB *sql.DB

// Initialize initializes the database connection and applies the schema
func Initialize() error {
	var err error
	DB, err = sql.Open("mysql", "your_username:your_password@tcp(your_host:your_port)/your_database")
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// Ensure the database is accessible
	err = DB.Ping()
	if err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// Run the schema SQL to create tables
	err = applySchema()
	if err != nil {
		return fmt.Errorf("failed to apply schema: %v", err)
	}

	log.Println("Database initialized successfully")
	return nil
}

// applySchema applies the SQL schema from the schema.sql file
func applySchema() error {
	schemaContent, err := os.ReadFile("./db/schema.sql")
	if err != nil {
		return fmt.Errorf("failed to read schema file: %v", err)
	}

	// Execute the SQL statements from the schema
	_, err = DB.Exec(string(schemaContent))
	if err != nil {
		return fmt.Errorf("failed to execute schema SQL: %v", err)
	}

	log.Println("Schema applied successfully")
	return nil
}

// Close closes the database connection
func Close() {
	err := DB.Close()
	if err != nil {
		log.Fatalf("Error closing database: %v", err)
	}
}
