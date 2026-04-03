# En güncel Ubuntu AMI ID'sini otomatik bulur
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu'nun sahibi)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

resource "aws_instance" "smartprogress_server" {
  ami           = data.aws_ami.ubuntu.id # Statik ID yerine bunu kullandık
  instance_type = "t3.micro"
  key_name      = "smartprogress-key"

  vpc_security_group_ids = [aws_security_group.server_sg.id]
  subnet_id              = aws_subnet.public_1.id

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update
              sudo apt-get install -y docker.io docker-compose
              sudo systemctl start docker
              sudo usermod -aG docker ubuntu
              EOF

  tags = {
    Name = "SmartProgress-Production-Server"
  }
}