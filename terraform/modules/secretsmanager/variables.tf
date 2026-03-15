variable "name_prefix" {
  type = string
}

variable "secret_name" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}