class ApiError extends Error{
    constructor(
        statusCode,
        message,
        errors = [],
        errorStack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.errors = errors

        if(errorStack){
            this.errorStack = errorStack
        }else{
            this.errorStack = this.stack
        }
        this.stack = ""
    }
} 
export {ApiError}