/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description: Schedule Script to Set the Date Invoiced Finalised Field  
 * 
 * @Last Modified by:   Sruti Desai
 * 
 */

define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format'],
    function(runtime, search, record, log, task, currentRecord, format) {
        var zee = 0;
        var role = runtime.getCurrentUser().role;
        var ctx = runtime.getCurrentScript();
        var usageThreshold = 500;
        var adhocInvDeploy = 'customdeploy2';
        var prevInvDeploy = ctx.deploymentId;

        var baseURL = 'https://1048144.app.netsuite.com';
        if (runtime.EnvType == "SANDBOX") {
            baseURL = 'https://system.sandbox.netsuite.com';
        }

        /**
         * [updateDateInvFin description] - Function to the set the Date Invoiced Finalised field in the job record.
         * @param {string} custscript_partner Partner ID
         * @param {string} custscript_startdate Start Date
         * @param {string} custscript_enddate End Date
         */
        
        function main() {
            
            log.debug({ title: 'START -->', details: ctx.getRemainingUsage() });
    

            var partner = parseInt(ctx.getParameter({ name: 'custscript_partner'}));
            var startDate = ctx.getParameter({ name: 'custscript_startdate' });
            var endDate = ctx.getParameter({ name: 'custscript_enddate' });
        
            log.debug({ title: 'partner', details: partner });
            log.debug({ title: 'startDate', details: startDate });
            log.debug({ title: 'endDate', details: endDate });
        
            if (!isNullorEmpty(ctx.getParameter({ name: 'custscript_prev_deploy' }) )) {
                
                log.emergency({ title: 'Received Parameters | ', details: 'Zee ID: ' + partner });
                log.emergency({ title: 'Received Parameters | ', details: 'Start Date: ' + startDate });
                log.emergency({ title: 'Received Parameters | ', details: 'End Date: ' + endDate });
                prevInvDeploy = ctx.getParameter({ name: 'custscript_prev_deploy' });
            } else {
                prevInvDeploy = ctx.getDeploymentId();
                log.emergency({ title: 'Initial Parameters | ', details: 'Zee ID: ' + partner });
                log.emergency({ title: 'Initial Parameters | ', details: 'Start Date: ' + startDate });
                log.emergency({ title: 'Initial Parameters | ', details: 'End Date: ' + endDate });
            }
        
            var searchedAlljobs = search.load({
                id: 'customsearch_inv_review_jobs_uninv',
                type: 'customrecord_job'
            })
        
            var zee_record = record.load({
                type: record.Type.PARTNER,
                id: partner,
            });
        
            var zee_text = zee_record.getValue({ fieldId: 'entitytitle' });
        
            var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";
        
        
            searchedAlljobs.filters.push(search.createFilter({ name: 'custrecord_job_date_inv_finalised', operator: search.Operator.ISEMPTY }));
            searchedAlljobs.filters.push(search.createFilter({ name: 'custrecord_job_date_reviewed', operator: search.Operator.ISNOTEMPTY }));
            if (!isNullorEmpty(startDate) && !isNullorEmpty(endDate)) {
        
                
                searchedAlljobs.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', operator: search.Operator.ONORAFTER, values: format.parse({ value: startDate, type: format.Type.DATE })}));
                searchedAlljobs.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', operator: search.Operator.ONORBEFORE, values: format.parse({ value: endDate, type: format.Type.DATE })}));
            }
        
        
            var resultSetAlljobs = searchedAlljobs.run();
        
            var count = 0;
        
            resultSetAlljobs.each(function(searchResultAlljobs) {
        
                count++;
        
                usageStart = ctx.getRemainingUsage();
        
                if (usageStart <= usageThreshold) {
        
                    log.debug({ title: 'SWITCHing -->', details: ctx }.getRemainingUsage());
        
                    var params = {
                        custscript_partner: partner,
                        custscript_prev_deploy: ctx.deploymentId,
                        custscript_startdate: startDate,
                        custscript_enddate: endDate
                    }
        
                    log.emergency({ title: 'Parameters Passed | ', details: 'Zee ID: ' + partner });
                    log.emergency({ title: 'Parameters Passed | ', details: 'Start Date: ' + startDate });
                    log.emergency({ title: 'Parameters Passed | ', details: 'End Date: ' + endDate });
                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        deploymentId: adhocInvDeploy,
                        params: params,
                        scriptId: prevInvDeploy,
                    })

                    reschedule.submit();

                    if (reschedule == false) {
                        return false;
                    }
                }
        
                var jobID = searchResultAlljobs.getValue('internalid');
                var jobService = searchResultAlljobs.getText("custrecord_job_service");
                var jobCustomer = searchResultAlljobs.getText("custrecord_job_customer");
                var specialCustomerType = searchResultAlljobs.getValue({ name: "custentity_special_customer_type", join: "CUSTRECORD_JOB_CUSTOMER", summary: null });
                var linkedMPCustomer = searchResultAlljobs.getValue({ name: "custentity_np_mp_customer", join: "CUSTRECORD_JOB_CUSTOMER", summary: null });
                var linkedSpecialCustomer = searchResultAlljobs.getValue({ name: "custentity_np_np_customer", join: "CUSTRECORD_JOB_CUSTOMER", summary: null });
                var jobPackageType = searchResultAlljobs.getValue({ name: "custrecord_service_package_type", join: "CUSTRECORD_JOB_SERVICE_PACKAGE", summary: null });
        
                try {
                    
                    var jobRecord = record.load({ type: 'customrecord_job', id: jobID });
        
                    //Below section is for Special Customers, so the job is transferred to that Special Customer and the Field SPECIAL CUSTOMER in the Job record is filled to the Special Customer.
        
                    //Below condition is to check if the customer to which the job is assigned to has both the LINKED MP CUSTOMER & SPECIAL CUSTOMER TYPE not null, then an error email is sent out. 
                    if (!isNullorEmpty(linkedMPCustomer) || !isNullorEmpty(specialCustomerType)) {
                        var body = 'Customer: ' + jobCustomer + ', has Linked MP Customer Field and Special Customer Type field set to ' + linkedMPCustomer + ' & ' + specialCustomerType + ' respectively.';
        
                        email.send({
                            author: 409635,
                            body: body,
                            recipients: ['ankith.ravindran@mailplus.com.au', 'Willian.Suryadharma@mailplus.com.au'],
                            subject: 'AIC: Date Invoice Finalised SC - Linked MP Customer & Customer Type both not null',
                        });

                    } else if (!isNullorEmpty(linkedSpecialCustomer) && isNullorEmpty(specialCustomerType)) {
        
                        //To check if the customer to which the job is assigned has the LINKED SPECIAL CUSTOMER filled & SPECIAL CUSTOMER TYPE not equal to null, then we go to the Linked Special customer record and get the Special Customer type. 
        
        
                        var specialCustomerRecord = record.load({ type: 'customer', id: linkedSpecialCustomer });
        
                        var specialCustomerSpecialCustomerType = specialCustomerRecord.getValue({ fieldId: 'custentity_special_customer_type' });
        
                        var specialCustomerTypeRecord = record.load({ type: 'customrecord_special_customer_type', id: specialCustomerSpecialCustomerType });
        
                        //Get the allowed services from the Special Customer Type record.
        
                        var allowedServicesIDs = specialCustomerTypeRecord.getValue({ fieldId: 'custrecord_special_allowed_service' });
                        var allowedServicesTexts = specialCustomerTypeRecord.getText({ fieldId: 'custrecord_special_allowed_service' });
        
                        var result = null;
        
                        //If the Special Customer Type is of type AusPost or Secure Cash
                        if (specialCustomerSpecialCustomerType == 2 || specialCustomerSpecialCustomerType == 3) {
                            //If the Allowed Services field is not null
                            if (!isNullorEmpty(allowedServicesTexts) && !isNullorEmpty(allowedServicesIDs)) {
                                // Check if the service performed by the job exists in the Allowed Services
                                result = allowedServicesTexts.indexOf(jobService);
        
                                // If exists
                                if (result >= 0) {
                                    //Fill the Special Customer with the Linked Special Customer
                                    jobRecord.setValue({ fieldId: 'custrecord_job_special_customer', value: linkedSpecialCustomer });
                                }
                            } else {
                                
                            }
                        } else {
                            //If Special Customer Type is of Type NeoPost.
        
                            //Get the Allowed Package from the Special Type record
                            var allowedPackage = specialCustomerTypeRecord.getValue({ fieldId: 'custrecord_special_allowed_package' });
        
                            //If allowed Package is equal to NeopPost
                            if (allowedPackage == jobPackageType) {
                                //Fill the Special Customer with the Linked Special Customer
                                jobRecord.setValue({ fieldId: 'custrecord_job_special_customer', value: linkedSpecialCustomer });
                            }
        
                        }
        
                    }
        
                    var jobGroupStatus = jobRecord.getValue({ fieldId: 'custrecord_job_group_status' });
                    var jobInvoiceable = jobRecord.getValue({ fieldId: 'custrecord_job_invoiceable' });
                    var jobCat = jobRecord.getValue({ fieldId: 'custrecord_job_service_category' });
                    var packageStatus = jobRecord.getValue({ fieldId: 'custrecord_package_status' });
                    var jobGroupSource = jobRecord.getValue({ fieldId: 'custrecord_job_source' });
        
                    if (isNullorEmpty(jobInvoiceable)) {
                        if (!isNullorEmpty(packageStatus)) {
                            if (packageStatus == 1 || isNullorEmpty(packageStatus)) {
                                // Job Group Status is Null for Extras and Jobs Created in NS
                                jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                            } else {
                                jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                            }
                        } else {
                            if (jobGroupStatus == 'Completed' || (isNullorEmpty(jobGroupStatus) && jobGroupSource == 5) || jobCat != '1') {
                                // Job Group Status is Null for Extras and Jobs Created in NS
                                jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                            } else {
                                jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                            }
                        }
        
                    }
        
                    jobRecord.setValue({ fieldId: 'custrecord_job_date_inv_finalised', value: getDate() });
        
                    jobRecord.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    });
        
                    usagePerLoop = ctx.getRemainingUsage() - usageStart
        
                    log.debug({ title: 'Loop #:' + count + ' | job id: ' + jobID + ' | Usg: ' + usagePerLoop });
        
                    return true;
                } catch (e) {
                    var message = '';
                    message += "Job: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=941&id=" + jobID + "'> View Job</a></br>";
                    message += "----------------------------------------------------------------------------------</br>";
                    message += e;
        
        
                    email.send({
                        author: 409635,
                        body: message,
                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                        subject: 'AIC - Review - Date Inv Finalised (SC) - Unable to update Job',
                    });
                }
        
                return true;
            });
        
            log.debug({ title: 'END -->', details: ctx.getRemainingUsage() });
        
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        return {
            execute: main
        }
    }
);