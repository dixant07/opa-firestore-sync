package example.policy

# Sample OPA policy for demonstration

default allow = false

# Allow admin users
allow {
    input.user == "admin"
}

# Allow read access to public resources
allow {
    input.action == "read"
    input.resource.public == true
}
