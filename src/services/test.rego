package test

# import future.keywords.in

default decision := false

decision if {    
    input.role == "Manager"
    input.module == "hrm"
    input.action == "read"
}
