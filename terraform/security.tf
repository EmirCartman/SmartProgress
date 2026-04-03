# EC2 Sunucusu Güvenlik Grubu
resource "aws_security_group" "server_sg" {
  name        = "smartprogress-server-sg"
  vpc_id      = aws_vpc.main.id

  # SSH Erişimi
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Uygulama Erişimi (Frontend/Backend Portu)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# RDS Veritabanı Güvenlik Grubu
resource "aws_security_group" "db_sg" {
  name        = "smartprogress-db-sg"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.server_sg.id] # Sadece bizim sunucumuz bağlanabilsin
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}