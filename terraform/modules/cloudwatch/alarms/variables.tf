variable "name_prefix" {
  type = string
}

variable "dlq_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
