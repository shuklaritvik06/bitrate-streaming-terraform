output "nat_gateway_ids" {
  value = aws_nat_gateway.this[*].id
}
