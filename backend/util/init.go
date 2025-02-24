package util

import (
	"database/sql"

	"github.com/jesee-kuya/hakikaride/backend/database"
)

var DB *sql.DB

func Init() {
	DB = database.CreateConnection()
}
