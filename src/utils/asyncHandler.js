
const asyncHandler = (requestHandler) => (req,res,next) => 
    Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))


// const asyncHandler = (requestHandler) => async (req,res) =>{
//     try {
//         await requestHandler(req,res)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success : false,
//             message : error.message
//         })
//     }
// }

export {asyncHandler}