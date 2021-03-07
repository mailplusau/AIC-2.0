/**
 * 
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 * 
 * Description: 
 * @Last Modified by: Sruti Desai
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
 
     function onRequest(context) {  
         
        var form = ui.createForm({
            title: ''
        });


        var custId = context.request.parameters.customer_id;
        var zee = context.request.parameters.zee;
        var jobs = context.request.parameters.job_array;
        var package = context.request.parameters.package_array;
        var invoiceable = context.request.parameters.invoiceable_array;
    
        var package_array = null;
        var invoiceable_array = null;


        if (!isNullorEmpty(custId) && !isNullorEmpty(jobs)) {
            var jobs_array = jobs.split(',');
            if (!isNullorEmpty(package)) {
                package_array = package.split(',');
            }
            if (!isNullorEmpty(invoiceable)) {
                invoiceable_array = invoiceable.split(',');
            }
    
            for (i = 0; i < jobs_array.length; i++) {
                if (!isNullorEmpty(jobs_array[i])) {
                    var jobRecord = record.load({
                        type: 'customrecord_job',
                        id: jobs_array[i],
                    });
    
                    if (!isNullorEmpty(package_array)) {
                        if (!isNullorEmpty(package_array[i])) {
                            jobRecord.setValue({ fieldId: 'custrecord_job_service_package', value: package_array[i] });
                        }
                    }
    
                    if (!isNullorEmpty(invoiceable_array)) {
                        if (!isNullorEmpty(invoiceable_array[i])) {
                            jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: invoiceable_array[i] });
                        }
                    }
    
                    jobRecord.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                  
                    jobRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
                }
            }
        }

        var params = new Array();
        params['customer_id'] = custId;
        params['zee'] = zee;
        params['start_date'] = context.request.parameters.start_date;
        params['end_date'] = context.request.parameters.end_date;

        redirect.toSuitelet({
            scriptId: 'customscript_sl_services_main_page',
            deploymentId: 'customdeploy_sl_services_main_page',
            parameters: params
        })

        // assignJobs();
        context.response.writePage(form);
     }
 
     function isNullorEmpty(strVal) {
         return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
     }
     
     return {
         onRequest: onRequest
     };
 
 });