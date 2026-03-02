function success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        timestamp: new Date().toISOString(),
        ...data,
    });
}

function paginate(items, page = 1, limit = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const results = items.slice(start, end);
    return {
        results,
        pagination: {
            page,
            limit,
            total: items.length,
            totalPages: Math.ceil(items.length / limit),
            hasNext: end < items.length,
            hasPrev: page > 1,
        },
    };
}

module.exports = { success, paginate };
