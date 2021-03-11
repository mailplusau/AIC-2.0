/**
 * 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * 
 * Description: 
 * @Last Modified by: Anesu Chakaingesu
 * 
 */


define(['N/ui/serverWidget', 'N/email', 'N/runtime', 'N/search', 'N/record', 'N/http', 'N/log', 'N/redirect', 'N/format'], 
function(ui, email, runtime, search, record, http, log, redirect, format) {
    var baseURL = 'https://1048144.app.netsuite.com';
    if (runtime.EnvType == "SANDBOX") {
        baseURL = 'https://1048144-sb3.app.netsuite.com';
    }
    var zee = 0;
    var role = runtime.getCurrentUser().role;
    if (role == 1000) {
        //Franchisee
        zee = runtime.getCurrentUser();
    } 

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
    function commonRows(params) {

        var common = '';
        for (var i = 0; i < params.length; i++) {
            common += '<td>' + params[i] + '</td>';
        }
        common += '</tr>';
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

    function job_page(request, response) {  
    
        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://1048144-sb3.app.netsuite.com';
        }
        var role = runtime.getCurrentUser().role;
        var ctx = runtime.getCurrentScript();
        var zee = ctx.getUser();
        
        var currRec = currentRecord.get();

        var status = null;
        toString();

        if (context.request.method === 'GET') {
            var params = context.request.parameters;

            var customer = params.customer_id;
            var service = params.service_id;
            var price = params.rate;
            var category = params.category;
            var packageID = params.package;
            status = params.status;

            var statusText = '';

            if (status == '1') {
                statusText = 'Completed'
            } else if (status == '2') {
                statusText = 'Partial'
            } else if (status == '3') {
                statusText = ''
            } else {
                statusText = null;
            }

            var customerName = search.lookupFields({
                type: 'customer',
                id: customer,
                columns: [ 'companyname']
            });

            var form = ui.createForm({
                title: 'Assign Packages to Jobs for ' + customerName
            });

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

            /**
             * [if description] -  if category is extras, search: Job - Invoicing Review - Invoicing Jobs
             * @param  {string} nlapiGetFieldValue('category') [description]
             */
            if (category == 'Extras') {
                // var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs');
                var searchedJobsExtras = search.load({
                    id: 'customsearch_job_invoicing_jobs',
                    type: 'customrecord_job'
                });
            } else {
                /**
                 * [if description] - If incoming status is 3, search: Job - Invoicing Review - Invoicing Jobs (Incomplete)
                 * @param  {string} nlapiGetFieldValue('incoming_status') [description]
                 */
                if (status == '3') {
                    // var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs_inc');
                    var searchedJobsExtras = search.load({
                        id: 'customsearch_job_invoicing_jobs_inc',
                        type: 'customrecord_job'
                    });
                } else {    
                    // var searchedJobsExtras = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs');
                    var searchedJobsExtras = search.load({
                        id: 'customsearch_job_invoicing_jobs',
                        type: 'customrecord_job'
                    });
                }
            }

            var filPo = [];
            filPo.push(['custrecord_job_service',search.Operator.IS, service]);
            filPo.push(['custrecord_job_service_price',search.Operator.IS, price]);
            filPo.push(['custrecord_job_customer',search.Operator.IS, customer]);
            // fil_po[fil_po.length] = new nlobjSearchFilter('custrecord_job_source', null, 'isnot', 'NetSuite']);
            if (!isNullorEmpty(status)) {
                filPo.push(['custrecord_job_group_status',search.Operator.IS, statusText]);
            }
            if (packageID == 'null') {
                filPo.push(['custrecord_job_service_package',search.Operator.ANYOF, '@NONE@']);
            } else {
                filPo.push(['custrecord_job_service_package',search.Operator.ANYOF, packageID]);
            }
            if (!isNullorEmpty(request.getParameter('start_date')) && !isNullorEmpty(request.getParameter('end_date'))) {
                filPo.push(['custrecord_job_date_scheduled',search.Operator.ONORAFTER, 
                    format.parse({
                        value: params.start_date,
                        type: format.Type.DATE
                    })
                ]);
                filPo.push(['custrecord_job_date_scheduled',search.Operator.ONORBEFORE,
                    format.parse({
                        value: params.end_date,
                        type: format.Type.DATE
                    })
                ]);
            }
    
            searchedJobsExtras.filterExpression = filPo;

            var resultSetExtras = searchedJobsExtras.run();

            if (ctx.getRole() == 1000) { //Franchisee
                zee = runtime.getCurrentUser().id;
            } else {
                zee = '6'; //Test
            }

            var filPoPackage = [];
            filPoPackage.push(['internalid', search.Operator.IS, service]);

            var poSearchPackage = search.create({
                type: 'customrecord_service',
                columns: [
                    'internalid',
                    'name',
                    'cutrecord_service_package'
                ]
            });

            form.addField({
                id: 'servservice_typeice_price',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.STARTROW
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            }).defaultValue = search.lookupFields({
                type: 'customrecord_service',
                id: service,
                columns: ['name']
            });

            form.addField({
                id: 'service_price',
                label: 'Service Price',
                type: ui.FieldType.TEXT
            }).updateLayoutType({
                layoutType: ui.FieldLayoutType.STARTROW
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.DISABLED
            }).defaultValue = price;  

            form.addField({
                id: 'service',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.service;
            form.addField({
                id: 'price',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.price;
            form.addField({
                id: 'customer',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.customer;
            form.addField({
                id: 'group_status',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.statusText;
            form.addField({
                id: 'category',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.category;
            form.addField({
                id: 'incoming_status',
                label: 'Service',
                type: ui.FieldType.TEXT
            }).updateDisplayType({
                displayType: ui.FieldDisplayType.HIDDEN
            }).defaultValue = params.status;

            var inlineQty = '<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><script src="//code.jquery.com/jquery-1.11.0.min.js"></script><link type="text/css" rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"><link href="//netdna.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css" rel="stylesheet"><script src="//netdna.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script></script><br><br><style>table#stockcount {font-size:12px; text-align:center; border-color: #24385b} </style><table border="0" cellpadding="10" id="stockcount" cellspacing="0" class="table table-striped"><thead style="color: white;background-color: #607799;"><tr><td style="color: rgb(255, 204, 0)"><b>PACKAGES</b></td><td><b>DATE SCHEDULED</b></td><td><b>TIME SCHEDULED</b></td><td><b>DATE FINALIZED</b></td><td><b>TIME FINALIZED</b></td><td><b>JOB LEG</b></td><td><b>OPERATOR ASSIGNED</b></td><td><b>STATUS</b></td></tr></thead><tbody>';

            var className = '';
            var i = 0;

            var oldJobGroup = null;

            resultSetExtras.each(function(searchResultExtras){
                var jobGroup = searchResultExtras.getValue({ name: 'custrecord_job_group' });
                var jobID = searchResultExtras.getValue({ name: 'internalid' });
                var jobSource = searchResultExtras.getText({ name: 'custrecord_job_source' });
                var jobDateSchedule = searchResultExtras.getValue({ name: 'custrecord_job_date_scheduled' });
                var jobTimeSchedule = searchResultExtras.getValue({ name: 'custrecord_job_time_scheduled_before' });
                var jobDateFinalised = searchResultExtras.getValue({ name: 'custrecord_job_date_finalised' });
                var jobTimeFinalised = searchResultExtras.getValue({ name: 'custrecord_job_time_finalised' });
                var jobServiceLeg = searchResultExtras.getValue({ name: 'custrecord_job_service_leg' });
                var jobOperatorAssigned = searchResultExtras.getText({ name: 'custrecord_job_operator_assigned' });
                var jobStatus = searchResultExtras.getText({ name: 'custrecord_job_status' });
                var jobInvoiceable = searchResultExtras.getValue({ name: 'custrecord_job_invoiceable' });
                var jobPackageID = searchResultExtras.getValue({ name: 'custrecord_job_service_package' });

                var params = [];
                params[params.length] = jobDateSchedule;
                params[params.length] = jobTimeSchedule;
                params[params.length] = jobDateFinalised;
                params[params.length] = jobTimeFinalised;
                params[params.length] = jobServiceLeg;
                params[params.length] = jobOperatorAssigned;
                params[params.length] = jobStatus;
            
                if (oldJobGroup != jobGroup) {
                    className = rowColor(className);
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
    
                    inlineQty += commonRows(params);
                } else {
                    inlineQty += '<tr class="' + className + '"><td></td>';
    
                    inlineQty += commonRows(params);
                }
    
                oldJobGroup = jobGroup;
                i++;
    
                return true;
            });

            if (i == 0) {
                inlineQty += '<tr><td colspan="11" style="font-weight: bold;text-align: center;font-size: 15px">NO COMPLETED JOBS</td></tr>';
            }

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
                label: 'Reviewed'
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

            var params2 = new Array();
            params2['customer_id'] = internalID;
            params2['start_date'] = params.start_date;
            params2['end_date'] = params.end_date;
        
            redirect.toSuitelet({
                scriptId: 'customscript_sl_services_main_page',
                deploymentId: 'customdeploy_sl_services_main_page',
                isExternal: null,
                parameters: params2
            });
        }
    }

    function isNullorEmpty(strVal) {
        return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
    }
    
    return {
        onRequest: onRequest
    };

});