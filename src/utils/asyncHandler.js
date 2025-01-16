export const asyncHandler = (fn) => async (req, res, next) => {
    try {
        return await fn(req, res, next);
        
    } catch (error) {

        if (error.code && error.code < 600) {
            res.status(error.code ).json({
            success: false,
            message:error.message
            })
        }
        res.status(500 ).json({
          success: false,
          message: error.message,
        });
    }
}
