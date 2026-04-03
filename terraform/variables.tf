variable "db_username" {
  description = "Veritabanı admin kullanıcı adı"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Veritabanı admin şifresi"
  type        = string
  sensitive   = true
}