output "instance_id" {
  description = "ID of the EC2 instance."
  value       = aws_instance.skillbridge.id
}

output "public_ip" {
  description = "Public IPv4 address of the EC2 instance."
  value       = aws_instance.skillbridge.public_ip
}

output "security_group_id" {
  description = "Security group attached to the EC2 instance."
  value       = aws_security_group.skillbridge.id
}
