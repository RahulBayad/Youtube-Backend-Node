class ApiError extends Error{
    constructor(
        statusCode,
        message,
        errorStack = "",
        errors = []
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.errors = errors

        if(errorStack){
            this.errorStack = errorStack
            // console.log("errorstack is present" , errorStack)
        }else{
            // Error.captureStackTrace(this, this.constructor)
            // console.log("errorstack making" , this.stack)
            this.errorStack = this.stack
        }
        this.stack = ""
    }
} 
export {ApiError}