resource "aws_eks_node_group" "smartprogress_nodes" {
  cluster_name    = aws_eks_cluster.smartprogress_eks.name
  node_group_name = "smartprogress-worker-nodes"
  node_role_arn   = aws_iam_role.eks_nodes_role.arn
  subnet_ids      = [aws_subnet.private_1.id, aws_subnet.private_2.id] # Güvenlik için Private subnet

  scaling_config {
    desired_size = 1 # Bütçe dostu: Sadece 1 makine
    max_size     = 1
    min_size     = 1
  }

  instance_types = ["t3.micro"] # AWS Free Tier kapsamındaki en küçük makine
  capacity_type  = "ON_DEMAND"  # "SPOT" seçersek daha ucuz olur ama makine her an kapanabilir

  depends_on = [
    aws_iam_role_policy_attachment.nodes_worker_policy,
    aws_iam_role_policy_attachment.nodes_cni_policy,
    aws_iam_role_policy_attachment.nodes_ecr_readonly,
  ]
}