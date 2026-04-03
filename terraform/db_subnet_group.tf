resource "aws_db_subnet_group" "smartprogress_db_subnet" {
  name       = "smartprogress-db-subnet-group"
  # Daha önce oluşturduğumuz private subnet ID'lerini buraya ekleyeceğiz
  subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id]

  tags = {
    Name = "SmartProgress DB Subnet Group"
  }
}