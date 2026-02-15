/**
 * Canonical Employee Entity
 *
 * OAGIS-aligned representation of an employee/personnel master record.
 * Source tables: SAP PA0001/PA0002, Infor LN tchrs001, Infor M3 CETEFX
 */

const BaseCanonicalEntity = require('../base-entity');

class Employee extends BaseCanonicalEntity {
  constructor() {
    super('Employee');
  }

  getRequiredFields() {
    return ['employeeId', 'firstName', 'lastName'];
  }

  getFieldDefinitions() {
    return {
      employeeId:       { type: 'string',  required: true,  maxLength: 8,   description: 'Personnel number' },
      firstName:        { type: 'string',  required: true,  maxLength: 40,  description: 'First name' },
      lastName:         { type: 'string',  required: true,  maxLength: 40,  description: 'Last name / family name' },
      fullName:         { type: 'string',  required: false, maxLength: 80,  description: 'Full formatted name' },
      personnelArea:    { type: 'string',  required: false, maxLength: 4,   description: 'Personnel area code' },
      personnelSubarea: { type: 'string',  required: false, maxLength: 4,   description: 'Personnel subarea code' },
      employeeGroup:    { type: 'string',  required: false, maxLength: 1,   description: 'Employee group (1=active, 2=retiree)' },
      employeeSubgroup: { type: 'string',  required: false, maxLength: 2,   description: 'Employee subgroup' },
      position:         { type: 'string',  required: false, maxLength: 8,   description: 'Position identifier in OM' },
      jobTitle:         { type: 'string',  required: false, maxLength: 40,  description: 'Job title / description' },
      orgUnit:          { type: 'string',  required: false, maxLength: 8,   description: 'Organizational unit' },
      costCenter:       { type: 'string',  required: false, maxLength: 10,  description: 'Cost center assignment' },
      startDate:        { type: 'date',    required: false,                  description: 'Employment start date' },
      email:            { type: 'string',  required: false, maxLength: 241, description: 'Work email address' },
    };
  }
}

module.exports = Employee;
