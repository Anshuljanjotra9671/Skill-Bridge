# EC2 infrastructure

This configuration creates an Amazon Linux 2023 EC2 instance in the default VPC, an encrypted gp3 root disk, and a security group.

- SSH (22) is allowed only from `admin_cidr`.
- Ports `80`, `443`, `5000`, and `8080` are public by default. For this project, Docker maps the frontend to `8080` and API to `5000`.
- All outbound traffic is allowed so the host can install packages and pull container images.

## Deploy

1. Configure AWS credentials (for example, `aws configure`). Ensure the selected region has a default VPC, or set `subnet_id` to a subnet in your own VPC and update the configuration to use that VPC's security group.
2. Copy `terraform.tfvars.example` to `terraform.tfvars`, then enter your existing EC2 key-pair name and public IP in CIDR notation.
3. From this directory, run:

```powershell
terraform init
terraform plan
terraform apply
```

Run `terraform destroy` when you no longer need the instance; this removes the instance and security group.
