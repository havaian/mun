const express = require('express');
const router = express.Router();
const controller = require('./controller');

// All org routes require authentication
// SuperAdmin routes
router.get('/',
    global.auth.token,
    global.auth.superAdmin,
    controller.getAllOrganizations
);
router.post('/',
    global.auth.token,
    global.auth.superAdmin,
    controller.createOrganization
);
router.delete('/:id',
    global.auth.token,
    global.auth.superAdmin,
    controller.deleteOrganization
);
router.post('/:id/assign-admin',
    global.auth.token,
    global.auth.superAdmin,
    controller.assignAdmin
);

// SuperAdmin or Org Admin
router.get('/:identifier',
    global.auth.token,
    controller.getOrganization
);
router.put('/:id',
    global.auth.token,
    controller.updateOrganization
);

module.exports = router;