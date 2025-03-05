package handler

import (
	"log"
	"net/http"
	"strings"

	"github.com/jesee-kuya/hakikaride/backend/models"
	"github.com/jesee-kuya/hakikaride/backend/repositories"
	"github.com/jesee-kuya/hakikaride/backend/util"
)

func SignupHandler(w http.ResponseWriter, r *http.Request) {
	var user models.User

	if r.Method == http.MethodPost {
		err := r.ParseForm()
		if err != nil {
			log.Printf("Failed parsing form: %v\n", err)
			ErrorHandler(w, "An Unexpected Error Occurred. Try Again Later", http.StatusInternalServerError)
			return
		}

		user.Username = strings.TrimSpace(r.FormValue("username"))
		user.Email = strings.TrimSpace(r.FormValue("email"))
		user.Password = strings.TrimSpace(r.FormValue("password"))
		user.UserType = strings.TrimSpace(r.FormValue("userType"))

		err = util.ValidateFormFields(user.Username, user.Email, user.Password)
		if err != nil {
			log.Println("Invalid form fields:", err)
			ErrorHandler(w, "Invalid Form Fields", http.StatusBadRequest)
			return
		}

		hashed, err := util.PasswordEncrypt([]byte(user.Password), 10)
		if err != nil {
			log.Printf("Failed encrypting password: %v\n", err)
			ErrorHandler(w, "An Unexpected Error Occurred. Try Again Later", http.StatusInternalServerError)
			return
		}

		_, err = repositories.InsertRecord(util.DB, "tblUsers", []string{"user_name", "user_email", "user_password", "user_type"}, user.Username, user.Email, string(hashed), user.UserType)
		if err != nil {
			log.Println("Error adding user:", err)
			http.Redirect(w, r, "/auth", http.StatusSeeOther)
			return
		}
		http.Redirect(w, r, "/auth", http.StatusSeeOther)
		return
	} else if r.Method == http.MethodGet {
		ErrorHandler(w, "An Unexpected Error Occurred. Try Again Later", http.StatusInternalServerError)
		return
	} else {
		log.Println("Method not allowed", r.Method)
		ErrorHandler(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
}
