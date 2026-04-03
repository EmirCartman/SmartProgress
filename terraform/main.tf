resource "aws_db_instance" "smartprogress_db" {
  allocated_storage      = 20
  db_name                = "smartprogress"
  engine                 = "postgres"
  engine_version         = "15"
  instance_class         = "db.t3.micro"
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.postgres15"

 
  db_subnet_group_name   = aws_db_subnet_group.smartprogress_db_subnet.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  skip_final_snapshot    = true
  publicly_accessible    = false
  multi_az               = false

  tags = {
    Name = "SmartProgress-DB"
  }
}