# Ana Ağ (VPC)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "SmartProgress-VPC" }
}

# İnternet Kapısı (Dış dünyaya çıkış için)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "SmartProgress-IGW" }
}

# Public Subnet (EC2 Sunucusu burada duracak)
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-central-1a"
  map_public_ip_on_launch = true # Sunucuya IP atanması için şart

  tags = { Name = "SmartProgress-Public-1" }
}

# Private Subnet 1 (RDS için)
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "eu-central-1a"

  tags = { Name = "SmartProgress-Private-1" }
}

# Private Subnet 2 (RDS için ikinci bölge şarttır)
resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "eu-central-1b"

  tags = { Name = "SmartProgress-Private-2" }
}

# Route Table (İnternet trafiğini yönlendirmek için)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public_rt.id
}