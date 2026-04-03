output "rds_endpoint" {
  description = "RDS bağlantı noktası (endpoint)"
  value       = aws_db_instance.smartprogress_db.endpoint
}

output "rds_hostname" {
  description = "RDS Host adı"
  value       = aws_db_instance.smartprogress_db.address
}

output "rds_port" {
  description = "RDS Port numarası"
  value       = aws_db_instance.smartprogress_db.port
}