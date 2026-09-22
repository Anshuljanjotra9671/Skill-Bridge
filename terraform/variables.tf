variable "aws_region" {
  description = "AWS region in which to create the instance."
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Prefix applied to AWS resource names and tags."
  type        = string
  default     = "skillbridge"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH access."
  type        = string
}

variable "admin_cidr" {
  description = "Your public IP address or trusted network in CIDR notation, allowed to SSH."
  type        = string
}

variable "subnet_id" {
  description = "Optional subnet ID. When null, the first subnet in the default VPC is used."
  type        = string
  default     = null
}

variable "public_tcp_ports" {
  description = "TCP ports exposed publicly. 8080 is the Docker frontend and 5000 is the API in this project."
  type        = set(number)
  default     = [80, 443, 5000, 8080]
}

variable "root_volume_size_gb" {
  description = "Size of the encrypted gp3 root volume in GiB."
  type        = number
  default     = 20
}
