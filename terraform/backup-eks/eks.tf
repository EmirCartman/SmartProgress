resource "aws_eks_cluster" "smartprogress_eks" {
  name     = "smartprogress-cluster"
  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    # Cluster'ın her iki subnet'e de erişimi olmalı
    subnet_ids = [aws_subnet.private_1.id, aws_subnet.private_2.id, aws_subnet.public_1.id]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]
}