/**
 * 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * 
 * Description: 
 * @Last Modified by: Sruti Desai
 * 
 */


define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log', 'N/redirect', 'N/format', 'N/currentRecord'], 
function(ui, email, runtime, search, record, http, log, redirect, format, currentRecord) {
    var baseURL = 'https://1048144.app.netsuite.com';
    if (runtime.EnvType == "SANDBOX") {
        baseURL = 'https://1048144-sb3.app.netsuite.com';
    }
    var role = runtime.getCurrentUser().role;
    var ctx = runtime.getCurrentScript();
    //var currRec = currentRecord.get();
    var zee = runtime.getCurrentUser().id;

    var status = null;

    /**
     * [commonRows description] - Returns the string of commons columns that needs to be created
     * @param  {array} params Job Source
     * @param  {array} params Date Scheduled
     * @param  {array} params Time Scheduled
     * @param  {array} params Date Finalised
     * @param  {array} params Time Finalised
     * @param  {array} params Service Leg
     * @param  {array} params Operator Assigned
     * @param  {array} params Status
     * @return {array}                     
     */
    function commonRows(params, category) {

        var common = '';
        for (var i = 0; i < params.length; i++) {
            common += '<td>' + params[i] + '</td>';
        }
        return common;
    }

    /**
     * Gets the the class name for the row
     * @param  {string} className Class name for the row color
     * @return {string}           Returns the class name of the row color
     */
    function rowColor(className) {
        if (className == 'info') {
            className = '';
        } else {
            className = 'info';
        }
        return className;
    }

    function onRequest(context) { 
        
        if (context.request.method === 'GET') {

            var customer = context.request.parameters.customer_id;
            var service = context.request.parameters.service_id;
            var price = context.request.parameters.rate;
            var category = context.request.parameters.category;
            var packageID = context.request.parameters.package;
            var assignPackage = context.request.parameters.assign_packge;
            staus = context.request.parameters.status;
            var locked = context.request.parameters.locked;
            var scID = context.request.parameters.sc;
            zee = context.request.parameters.zee;

            log.debug({
                title: 'price',
                details: price
            });

            var discount_period = null;
            if (!isNullorEmpty(packageID) && packageID != 'null') {
                var package_record = record.load({ type:'customrecord_service_package', id: packageID});
                var package_name = package_record.getValue({ fieldId: 'name'});
                discount_period = package_record.getValue({ fieldId: 'custrecord_service_package_disc_period'});
                if (discount_period == 3) {
                    locked = 'yes';
                }
            }

            var customerName = search.lookupFields({
                type: 'customer',
                id: customer,
                columns: 'companyname'
            });
            var customerID = search.lookupFields({
                type: 'customer', 
                id: customer,
                columns: 'entityid'
            });
            
            var statusText = '';

            if (staus == '1') {
                statusText = 'Completed'
            } else if (staus == '2') {
                statusText = 'Partial'
            } else if (staus == '3') {
                statusText = 'Incomplete'
            } else {
                statusText = 'Scheduled';
            }

            if (!isNullorEmpty(assignPackage) && assignPackage != 'undefined') {
                var form = ui.createForm({
                    title: 'Activity Page: ' + customerID + ' ' + customerName
                });
                var filPoPackage = [];
                filPoPackage.push(['internalid', search.Operator.IS, service]);

                // var colPoPackage = [];
                // colPoPackage[colPoPackage.length] = new nlobjSearchColumn('internalid');
                // colPoPackage[colPoPackage.length] = new nlobjSearchColumn('name');
                // colPoPackage[colPoPackage.length] = new nlobjSearchColumn('custrecord_service_package');

                var poSearchPackage = search.create({
                    type: 'customrecord_service',
                    columns: [{
                        name: 'internalid'
                    }, {
                        name: 'custrecord_service_package'
                    }, {
                        name: 'name'
                    }]
                });

            } else if (!isNullorEmpty(staus)) {
                var form = ui.createForm({
                    title: 'Activity Page: ' + customerID + ' ' + customerName
                });
            } else {
                var form = ui.createForm({
                    title: 'Activity Page: ' + customerID + ' ' + customerName
                });
            }

            form.addField({
                id: 'start_date',
                label: 'text',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.start_date;

            form.addField({
                id: 'end_date',
                label: 'text',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.end_date;

            form.addField({
                id: 'locked',
                label: 'locked',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = locked;

            form.addField({
                id: 'scid',
                label: 'locked',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = scID;

            // nlapiLogExecution('DEBUG', 'Dicount Period', discount_period);

            //NOT ABLE TO CREATE CODE FILTERS FOR INCOMPLETE / SCHEDULE / NULL HENCE CREATED TWO SEARCHES 
            /**
             * [if description] -  if category is extras, search: Job - Invoicing Review - Invoicing Jobs
             * @param  {string} nlapiGetFieldValue('category') [description]
             */
            // if (category == 'Extras') {
            //     var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs');
            // } else {

            /**
             * [if description] - If incoming status is 3, search: Job - Invoicing Review - Invoicing Jobs (Incomplete)
             * @param  {string} nlapiGetFieldValue('incoming_status') [description]
             */
            // if (staus == '3' || staus == '4') {
            //     var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs_inc');
            // } else {
                var searchedJobsExtras = search.load({ type: 'customrecord_job', id: 'customsearch_job_invoicing_jobs'});
            // }
            // }

            var filPo = [];
            filPo.push(['custrecord_job_customer',search.Operator.IS, customer]);
            filPo.push(['custrecord_job_source',search.Operator.ANYOF, [4, 5, 6]]);

            if (packageID == 'null') {
                filPo.push(['custrecord_job_service',search.Operator.IS, service]);
                filPo.push(['custrecord_job_service_price',search.Operator.EQUALTO, parseFloat(price)]);
                filPo.push(['custrecord_job_service_package',search.Operator.ANYOF, '@NONE@']);
                if (category == 'Services') {
                    filPo.push(['custrecord_job_group_status',search.Operator.IS, statusText]);
                }
            } else {
                filPo.push(['custrecord_job_service_package',search.Operator.ANYOF, packageID]);

                if (discount_period == 3) {
                    filPo.push(['custrecord_job_service',search.Operator.IS, service]);
                    filPo.push(['custrecord_job_service_price',search.Operator.EQUALTO, parseFloat(price)]);
                    // filPo.push(['custrecord_job_service_package',search.Operator.anyof, '@NONE@']);
                    if (category == 'Services') {
                        filPo.push(['custrecord_job_group_status',search.Operator.IS, statusText]);
                    }
                } else {
                    filPo.push(['custrecord_package_status',search.Operator.IS, staus]);
                }
            }
            if (!isNullorEmpty(params.start_date) && !isNullorEmpty(params.end_date)) {
                filPo.push(['custrecord_job_date_scheduled', search.Operator.ONORAFTER, format.parse({
                    value: params.start_date,
                    type: format.Type.DATE
                })]);
                filPo.push(['custrecord_job_date_scheduled', search.Operator.ONORBEFORE, format.parse({
                    value: params.end_date,
                    type: format.Type.DATE
                })]);
            }      

            if (!isNullorEmpty(scID)) {
                filPo.push(['custrecord_job_special_customer', search.Operator.IS, scID]);
            } else {
                filPo.push(['custrecord_job_special_customer', search.Operator.IS, '@NONE@']);
            }

            searchedJobsExtras.addFilters(filPo);

            var resultSetExtras = searchedJobsExtras.runSearch();

            // if (ctx.getRole() == 1000) { //Franchisee
            //     zee = ctx.getUser();
            // } else {
            //     zee = '6'; //Test
            // }

            form.addField({
                id: 'service',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = service;
            form.addField({
                id: 'price',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = price;
            form.addField({
                id: 'customer',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = customer;

            form.addField({
                id: 'zee_id',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = zee;
            form.addField({
                id: 'group_status',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = statusText;
            form.addField({
                id: 'incoming_status',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = status;

            form.addField({
                id: 'category',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = category;
            form.addField({
                id: 'package',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = assignPackage;
            form.addField({
                id: 'package_id',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = packageID;
            form.addField({
                id: 'job_array',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            form.addField({
                id: 'package_array',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });
            form.addField({
                id: 'invoiceable_array',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            });

            var inlineQty = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link type="text/css" rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script></script><br><br><style>table#stockcount {font-size:12px; text-align:center; border-color: #24385b} </style>';

            if (discount_period == 3) {
                inlineQty += '<div id="demo" style="background-color: #cfeefc !important;border: 1px solid #417ed9;padding: 10px 10px 10px 20px;width:98%;margin-bottom: 10px;"><b><u>Important Instructions:</u></b><ul><li>Jobs belongs to Monthly Fixed Rate Service Package: <b>' + package_name + '</b>.</li><li>Invoiceable status on Jobs are not modifiable as the the Service Package is configured as a monthly Fixed Rate package.</li><li>You may modify the invoice amount for this package on the Review Page (click Back).</li></ul></div>';
            }

            if (packageID == 'null' || (!isNullorEmpty(discount_period) && discount_period == 3)) {
                var serviceRecord = record.load({ type: 'customrecord_service', id: service});
                var service_zee = serviceRecord.getText({ fieldId: 'custrecord_service_franchisee' });
                if (isNullorEmpty(service_zee)) {
                    service_zee = 'All';
                }
                inlineQty += '<div class="row"><div class="col-xs-3"><label class="control-label">Service</label><input type="text" readonly class="form-control" value="' + search.lookupFields({
                    type: 'customrecord_service',
                    id: service,
                    columns: 'name'
                }) + '" style="font-weight: bold;" /></div><div class="col-xs-3"><label class="control-label">Service Price</label><input type="text" readonly class="form-control" value="' + price + '" style="font-weight: bold;"/></div><div class="col-xs-3"><label class="control-label">Franchisee</label><input type="text" readonly class="form-control" value="' + service_zee + '" style="font-weight: bold;" /></div></div><br><br>';
            } else {
                inlineQty += '<div class="row"><div class="col-xs-3"><label class="control-label">Package Name</label><input type="text" readonly class="form-control" value="' + search.lookupFields({
                    type: 'customrecord_service_package',
                    id: packageID,
                    columns: 'name'
                }) + '" style="font-weight: bold;" /></div></div><br><br>'
            }

            inlineQty += '<table border="0" cellpadding="10" id="stockcount" cellspacing="0" class="table"><thead style="color: white;background-color: #607799;"><tr>';
            if (isNullorEmpty(assignPackage) || assignPackage == 'undefined') {
                if (packageID != 'null' && (!isNullorEmpty(discount_period) && discount_period != 3)) {
                    inlineQty += '<td class="col-xs-2" style="color: rgb(255, 204, 0)"><b>DO YOU WANT TO INVOICE PACKAGE GROUP?</b></td><td><b>SERVICE NAME</b></td><td><b>PRICE</b></td>';
                } else {
                    inlineQty += '<td class="col-xs-2" style="color: rgb(255, 204, 0)"><b>Do you want to Invoice Service</b></td>';
                }

            } else {
                inlineQty += '<td style="color: rgb(255, 204, 0)"><b>PACKAGES</b></td><td><b>SERVICE NAME</b></td><td><b>PRICE</b></td>';
            }

            inlineQty += '<td><b>SOURCE</b></td>';

            if (category == 'Extras') {
                inlineQty += '<td><b>EXTRAS QTY</b></td>';
                inlineQty += '<td><b>DATE FINALIZED</b></td><td><b>TIME FINALIZED</b></td><td><b>JOB GROUP SERVICE</b></td>';
                inlineQty += '<td><b>FRANCHISEE</b></td><td><b>OPERATOR ASSIGNED</b></td><td><b>STATUS</b></td><td><b>JOB INTERNAL ID</b></td></tr></thead><tbody>';

            } else {
                inlineQty += '<td><b>DATE SCHEDULED</b></td><td><b>TIME SCHEDULED</b></td>';
                inlineQty += '<td><b>DATE FINALIZED</b></td><td><b>TIME FINALIZED</b></td>';
                inlineQty += '<td><b>JOB LEG</b></td>';
                inlineQty += '<td><b>FRANCHISEE</b></td><td><b>OPERATOR ASSIGNED</b></td><td><b>STATUS</b></td><td><b>JOB INTERNAL ID</b></td>';
            }

            if (packageID != 'null' && (!isNullorEmpty(discount_period) && discount_period != 3)) {
                inlineQty += '<td>PACKAGE STATUS</td><td>JOB GROUP LINKED</td><td>INVOICEABLE</td>';
            }

            inlineQty += '</tr></thead><tbody>'


            var i = 0;

            var oldJobGroup = null;
            var old_package_job_groups = null;

            var className = '';

            resultSetExtras.each(function(searchResultExtras) {

                // nlapiLogExecution('DEBUG', 'inside loop');

                var jobGroup = searchResultExtras.getValue({ name: 'custrecord_job_group'});
                var jobSource = searchResultExtras.getText({ name: 'custrecord_job_source'});
                var jobDateSchedule = searchResultExtras.getValue({ name: 'custrecord_job_date_scheduled'});
                var jobTimeSchedule = searchResultExtras.getValue({ name: 'custrecord_job_time_scheduled_before'});
                var jobDateFinalised = searchResultExtras.getValue({ name: 'custrecord_job_date_finalised'});
                var jobTimeFinalised = searchResultExtras.getValue({ name: 'custrecord_job_time_finalised'});
                var jobServiceLeg = searchResultExtras.getValue({ name: 'custrecord_job_service_leg'});
                var jobOperatorAssigned = searchResultExtras.getText({ name: 'custrecord_job_operator_assigned'});
                var jobStatus = searchResultExtras.getText({ name: 'custrecord_job_status'});
                var jobInvoiceable = searchResultExtras.getValue({ name: 'custrecord_job_invoiceable'});
                var jobInvoiceableText = searchResultExtras.getText({ name: 'custrecord_job_invoiceable'});
                var jobPackageID = searchResultExtras.getValue({ name: 'custrecord_job_service_package'});
                var jobID = searchResultExtras.getValue({ name: 'internalid'});
                var extrasQty = searchResultExtras.getValue({ name: 'custrecord_job_extras_qty'});
                var package_job_groups = searchResultExtras.getValue({ name: 'custrecord_package_job_groups'});
                var serviceID = searchResultExtras.getText({ name: 'custrecord_job_service'});
                var packageStatus = searchResultExtras.getText({ name: 'custrecord_package_status'});
                // var packageJobGroups = searchResultExtras.getValue({ name: "custrecord_service_description", join: "CUSTRECORD_JOB_SERVICE",null);
                var servicePrice = searchResultExtras.getValue({ name: 'custrecord_job_service_price'});
                var jobZee = searchResultExtras.getText({ name: 'custrecord_job_franchisee'});
                var jobGroupService = searchResultExtras.getText({ name: "custrecord_jobgroup_service", join: "CUSTRECORD_JOB_GROUP"});

                package_job_groups = package_job_groups.split(',').sort().join(',');

                var params = [];
                params[params.length] = jobSource;
                if (category == 'Extras') {
                    params[params.length] = extrasQty;
                    params[params.length] = jobDateFinalised;
                    params[params.length] = jobTimeFinalised;
                    params[params.length] = jobGroupService;
                } else {
                    params[params.length] = jobDateSchedule;
                    params[params.length] = jobTimeSchedule;
                    params[params.length] = jobDateFinalised;
                    params[params.length] = jobTimeFinalised;
                    params[params.length] = jobServiceLeg;
                }

                params[params.length] = jobZee;
                params[params.length] = jobOperatorAssigned;
                params[params.length] = jobStatus;
                params[params.length] = jobID;

                if (isNullorEmpty(jobPackageID)) {
                    jobPackageID = 0;
                }

                if (packageID == 'null' || (!isNullorEmpty(discount_period) && discount_period == 3)) {
                    if (oldJobGroup != jobGroup) {
                        className = rowColor(className);
                        if (!isNullorEmpty(assignPackage) && assignPackage != 'undefined') {
                            inlineQty += '<tr class="' + className + '" style="border-top-style: solid; border-top-width: 2px; border-top-color: grey;"><td><select class="form-control" id="package_assigned[' + i + ']" data-jobid="' + jobID + '" data-jobgroup="' + jobGroup + '" class="package_assigned"><option value="0">No Package</option>';

                            for (z = 0; z < poSearchPackage.length; z++) {
                                var packageIds = poSearchPackage[z].getValue({ name: 'custrecord_service_package' });
                                if (!isNullorEmpty(packageIds)) {
                                    var packageIds = packageIds.split(',');
                                    for (var x = 0; x < packageIds.length; x++) {
                                        if (jobPackageID == packageIds[x]) {
                                            inlineQty += '<option value="' + packageIds[x] + '" selected>' + search.lookupFields({
                                                type: 'customrecord_service_package',
                                                id: packageIds[x],
                                                columns: ['name']
                                            }) + '</option>';
                                        } else {
                                            inlineQty += '<option value="' + packageIds[x] + '">' + search.lookupFields({
                                                type: 'customrecord_service_package',
                                                id: packageIds[x],
                                                columns: ['name']
                                            }) + '</option>';
                                        }
                                    }
                                }
                            }
                            inlineQty += '</select><input type="hidden" id="default_value[' + i + ']" value="' + jobPackageID + '" /></td>';
                        } else {
                            inlineQty += '<tr class="' + className + '" style="border-top-style: solid; border-top-width: 2px; border-top-color: grey;"><td>';
                            if (jobInvoiceable == 1 || jobInvoiceable == 2) {
                                var optionRow = selectedOption(jobInvoiceable, i);
                                inlineQty += optionRow;
                            } else {
                                if (category == 'Extras') {
                                    var optionRow = selectedOption(1, i);
                                } else {
                                    var optionRow = selectedOption(parseInt(staus), i);
                                }

                                inlineQty += optionRow;
                            }
                            inlineQty += '</td>';
                        }

                        inlineQty += commonRows(params);
                        inlineQty += '</tr>';
                    } else {
                        // nlapiLogExecution('DEBUG', 'inside', oldJobGroup);
                        inlineQty += '<tr class="' + className + '"><td></td>';
                        inlineQty += commonRows(params, category);
                        inlineQty += '</tr>';

                    }
                } else {
                    // nlapiLogExecution('DEBUG', 'inside');
                    if (old_package_job_groups !== package_job_groups) {
                        log.debug({
                            title: 'new group',
                            details: package_job_groups
                        });
                        className = rowColor(className);
                        if (!isNullorEmpty(assignPackage) && assignPackage != 'undefined') {
                            inlineQty += '<tr class="' + className + '" style="border-top-style: solid; border-top-width: 2px; border-top-color: grey;"><td><select class="form-control" id="package_assigned[' + i + ']" data-jobid="' + jobID + '" data-jobgroup="' + jobGroup + '" class="package_assigned"><option value="0">No Package</option>';

                            for (z = 0; z < poSearchPackage.length; z++) {
                                var packageIds = poSearchPackage[z].getValue({ name: 'custrecord_service_package' });
                                if (!isNullorEmpty(packageIds)) {
                                    var packageIds = packageIds.split(',');
                                    for (var x = 0; x < packageIds.length; x++) {
                                        if (jobPackageID == packageIds[x]) {
                                            inlineQty += '<option value="' + packageIds[x] + '" selected>' + search.lookupFields({
                                                type: 'customrecord_service_package',
                                                id: packageIds[x],
                                                columns: ['name']
                                            }) + '</option>';
                                        } else {
                                            inlineQty += '<option value="' + packageIds[x] + '">' + search.lookupFields({
                                                type: 'customrecord_service_package',
                                                id: packageIds[x],
                                                columns: ['name']
                                            }) + '</option>';
                                        }
                                    }
                                }
                            }
                            inlineQty += '</select><input type="hidden" id="default_value[' + i + ']" value="' + jobPackageID + '" /></td>';
                        } else {
                            inlineQty += '<tr class="' + className + '" style="border-top-style: solid; border-top-width: 2px; border-top-color: grey;"><td>';
                            if (jobInvoiceable == 1 || jobInvoiceable == 2) {
                                var optionRow = selectedOption(jobInvoiceable, i);
                                inlineQty += optionRow;
                            } else {
                                if (category == 'Extras') {
                                    var optionRow = selectedOption(1, i);
                                } else {
                                    var optionRow = selectedOption(parseInt(staus), i);
                                }
                                inlineQty += optionRow;
                            }
                            inlineQty += '</td>';
                        }
                        inlineQty += '<td>' + serviceID + '</td>';
                        inlineQty += '<td>' + servicePrice + '</td>';
                        inlineQty += commonRows(params);
                        inlineQty += '<td>' + packageStatus + '</td>';
                        inlineQty += '<td>' + package_job_groups + '</td>';
                        inlineQty += '<td>' + jobInvoiceableText + '</td>';
                        inlineQty += '</tr>';
                    } else {
                        log.debug({
                            title: 'same group',
                            details: old_package_job_groups
                        });
                        inlineQty += '<tr class="' + className + '"><td></td>';
                        inlineQty += '<td>' + serviceID + '</td>'
                        inlineQty += '<td>' + servicePrice + '</td>'
                        inlineQty += commonRows(params, category);
                        inlineQty += '<td>' + packageStatus + '</td>';
                        inlineQty += '<td>' + package_job_groups + '</td>';
                        inlineQty += '<td>' + jobInvoiceableText + '</td>';
                        inlineQty += '</tr>';
                    }
                }

                oldJobGroup = jobGroup;
                old_package_job_groups = package_job_groups;

                i++;

                return true;
            });

            form.addField({
                id: 'preview_table',
                label: 'inlinehtml',
                type: 'inlinehtml'
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.STARTROW
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.OUTSIDEBELOW
            }).defaultValue = inlineQty;  
            
            form.addSubmitButton({
                label: 'Save'
            });

            form.addButton({
                id: 'back',
                label: 'Back', 
                function: 'onclick_Back()'
            });

            form.addButton({
                id: 'reset',
                label: 'Reset', 
                function: 'onclick_reset()'
            });

            form.clientScriptFileId = //; // GET THE CLIENT ID

            context.response.writePage(form);

        } else {
            var internalID = params.customer;
            var package_array = params.package_array;
            var invoiceable_array = params.invoiceable_array;
            var job_array = params.job_array;


            // nlapiLogExecution('DEBUG', 'job_array', job_array);
            // nlapiLogExecution('DEBUG', 'package_array', package_array);
            // nlapiLogExecution('DEBUG', 'invoiceable_array', invoiceable_array);

            // var params = new Array();
            // params['customer_id'] = internalID;
            // params['start_date'] = request.getParameter('start_date');
            // params['end_date'] = request.getParameter('end_date');  

            var params = new Array();
            params['customer_id'] = internalID;
            params['package_array'] = package_array;
            params['job_array'] = job_array;
            params['invoiceable_array'] = invoiceable_array;
            params['start_date'] = params.start_date;
            params['end_date'] = params.end_date;
            params['sc'] = params.scid;
            params['zee'] = params.zee_id;
            params['locked'] = params.locked;


            // nlapiSetRedirectURL('SUITELET', 'customscript_sl_services_main_page', 'customdeploy_sl_services_main_page', null, params);
            redirect.toSuitelet({
                scriptId: 'customscript_sl_assign_jobs',
                deploymentId: 'customdeploy_sl_assign_jobs',
                isExternal: null,
                parameters: params
            })
        }
    }

    function selectedOption(option, i) {

        var rows = '';
    
        // nlapiLogExecution('DEBUG', 'option', option);
    
        if (option == 1 || isNullorEmpty(option)) {
            rows += '<div class="form-group has-success invoiceable_border">';
        } else {
            rows += '<div class="form-group has-error invoiceable_border">';
        }
    
        rows += '<div class="input-group"><select class="form-control input-group-addon inv_dropdown" id="invoiceable[' + i + ']" style="margin-right: 100px;">';
        if (option == 1 || isNullorEmpty(option)) {
            rows += '<option value="1" selected="selected">Yes</option><option value="2">No</option>';
        } else {
            rows += '<option value="1">Yes</option><option value="2" selected="selected">No</option>'
        }
    
        rows += '</select></div><input type="hidden" id="default_value[' + i + ']" value="' + option + '" />';
    
        // nlapiLogExecution('DEBUG', rows, rows);
    
        return rows;
    
    }

    function isNullorEmpty(strVal) {
        return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
    }
    
    return {
        onRequest: onRequest
    };

});