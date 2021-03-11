/**
 * Module Description
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * 
 * Author: Anesu Chakaingesu    
 *
 * NSVersion  Date                      Last Modified time                      
 * 2.00       2021-03-05 09:00:00       2021-03-05 17:00:00           
 *
 * Remarks: Schedule Script to the set the Date Review Field.
 *
 */
var ctx = nlapiGetContext();
var usageThreshold = 50;
var adhocInvDeploy = 'customdeploy2';
var prevInvDeploy = null;

/**
 * [setDateReview description] - Schedule Script to the set the Date Review Field.
 * @param {string} custscript_customerid Customer ID
 * @param {string} custscriptstart_date Invoicing Start date
 * @param {string} custscriptend_date Invoicing End Date
 */
function setDateReview() {

    var customerID = ctx.getSetting('SCRIPT', 'custscript_customerid');
    var zeeID = parseInt(ctx.getSetting('SCRIPT', 'custscriptzee_id'));
    var startDate = ctx.getSetting('SCRIPT', 'custscriptstart_date');
    var endDate = ctx.getSetting('SCRIPT', 'custscriptend_date');



    if (!isNullorEmpty(ctx.getSetting('SCRIPT', 'custscript_prevdeploy'))) {
        nlapiLogExecution('EMERGENCY', 'Received Parameters | ', 'Customer ID: ' + customerID);
        nlapiLogExecution('EMERGENCY', 'Received Parameters | ', 'Zee ID: ' + zeeID);
        nlapiLogExecution('EMERGENCY', 'Received Parameters | ', 'Start Date: ' + startDate);
        nlapiLogExecution('EMERGENCY', 'Received Parameters | ', 'End Date: ' + endDate);
        prevInvDeploy = ctx.getSetting('SCRIPT', 'custscript_prevdeploy');
    } else {
        nlapiLogExecution('EMERGENCY', 'Initial Parameters | ', 'Customer ID: ' + customerID);
        nlapiLogExecution('EMERGENCY', 'Initial Parameters | ', 'Zee ID: ' + zeeID);
        nlapiLogExecution('EMERGENCY', 'Initial Parameters | ', 'Start Date: ' + startDate);
        nlapiLogExecution('EMERGENCY', 'Initial Parameters | ', 'End Date: ' + endDate);
        prevInvDeploy = ctx.getDeploymentId();
    }

    nlapiLogExecution('AUDIT', 'START --> Set Date Review | Customer: ' + customerID, ctx.getRemainingUsage());

    try {

        var zee_record = nlapiLoadRecord('partner', zeeID);

        var zee_text = zee_record.getFieldValue('entitytitle');

        // Set the review date and the invoiceable field for each and every job
        var searchedJobs = nlapiLoadSearch('customrecord_job', 'customsearch_inv_review_jobs_uninv');

        var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";

        var newFilters = new Array();
        newFilters[newFilters.length] = new nlobjSearchFilter('custrecord_job_customer', null, 'is', customerID);
        newFilters[newFilters.length] = new nlobjSearchFilter('formulatext', null, 'is', zee_text).setFormula(strFormula);
        if (!isNullorEmpty(startDate) && !isNullorEmpty(endDate)) {

            newFilters[newFilters.length] = new nlobjSearchFilter('custrecord_job_date_scheduled', null, 'onorafter', nlapiStringToDate(startDate));
            newFilters[newFilters.length] = new nlobjSearchFilter('custrecord_job_date_scheduled', null, 'onorbefore', nlapiStringToDate(endDate));
        }

        searchedJobs.addFilters(newFilters);

        var resultSet = searchedJobs.runSearch();

        resultSet.forEachResult(function(searchResult) {

            var usageStart = ctx.getRemainingUsage();

            if (usageStart <= usageThreshold) {

                nlapiLogExecution('DEBUG', 'SWITCHing -->', ctx.getRemainingUsage());

                var params = {
                    custscript_customerid: customerID,
                    custscriptzee_id: zeeID,
                    custscript_prevdeploy: ctx.getDeploymentId(),
                    custscriptstart_date: startDate,
                    custscriptend_date: endDate
                }
                nlapiLogExecution('EMERGENCY', 'Parameters Passed | ', 'Customer ID: ' + customerID);
                nlapiLogExecution('EMERGENCY', 'Parameters Passed | ', 'Zee ID: ' + zeeID);
                nlapiLogExecution('EMERGENCY', 'Parameters Passed | ', 'Start Date: ' + startDate);
                nlapiLogExecution('EMERGENCY', 'Parameters Passed | ', 'End Date: ' + endDate);

                var reschedule = rescheduleScript(prevInvDeploy, adhocInvDeploy, params);
                if (reschedule == false) {
                    return false;
                }
            }

            // nlapiLogExecution('AUDIT', 'Set Date Review | Customer: ' + customerID, ctx.getRemainingUsage());

            try {

                var jobRecord = nlapiLoadRecord('customrecord_job', searchResult.getValue('internalid'));

                var jobGroupStatus = jobRecord.getFieldValue('custrecord_job_group_status');
                var jobInvoiceable = jobRecord.getFieldValue('custrecord_job_invoiceable');
                var jobCat = jobRecord.getFieldValue('custrecord_job_service_category');
                var packageStatus = jobRecord.getFieldValue('custrecord_package_status');
                var jobGroupSource = jobRecord.getFieldValue('custrecord_job_source');

                if (isNullorEmpty(jobInvoiceable)) {

                    if (!isNullorEmpty(packageStatus)) {
                        if (packageStatus == 1 || isNullorEmpty(packageStatus)) {
                            // Job Group Status is Null for Extras and Jobs Created in NS
                            jobRecord.setFieldValue('custrecord_job_invoiceable', 1);
                        } else if (packageStatus == 3 || packageStatus == 2) {
                            jobRecord.setFieldValue('custrecord_job_invoiceable', 2);
                        } else {
                            // If the Job Group Status is Scheduled, Invoiceable does not get set to anything
                        }
                    } else {
                        if (jobGroupStatus == 'Completed' || (isNullorEmpty(jobGroupStatus) && jobGroupSource == 5) || jobCat != '1') {
                            // Job Group Status is Null for Extras and Jobs Created in NS
                            jobRecord.setFieldValue('custrecord_job_invoiceable', 1);
                        } else {
                            jobRecord.setFieldValue('custrecord_job_invoiceable', 2);
                        }

                        // 
                        // } else if (jobGroupStatus == 'Incomplete' || jobGroupStatus == 'Partial') {
                        //     jobRecord.setFieldValue('custrecord_job_invoiceable', 2);
                        // } else {
                        //     // If the Job Group Status is Scheduled, Invoiceable does not get set to anything to allow users to review any scheduled jobs upto end of month before setting invoiceable to NO when FINALISE button is clicked.  
                        // }
                    }

                }

                jobRecord.setFieldValue('custrecord_job_date_reviewed', getDate());
                nlapiSubmitRecord(jobRecord);


                nlapiLogExecution('DEBUG', 'Set Date Review | Job: ' + searchResult.getValue('internalid'), (usageStart - ctx.getRemainingUsage()));
                return true;
            } catch (e) {
                var message = '';
                message += "Customer Internal ID: " + customerID + "</br>";
                message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customerID + "'> View Customer </a></br>";
                message += "----------------------------------------------------------------------------------</br>";
                message += "Job: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=941&id=" + searchResult.getValue('internalid') + "'> View Job</a></br>";
                message += "----------------------------------------------------------------------------------</br>";
                message += e;


                nlapiSendEmail(409635, ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'], 'AIC - Review - Date Review (SC) - Unable to update Job', message, null);
            }
        });

        //Unset the AIC Date Reviwed Field once all the jobs associated with the customer has been reviewed.
        var recCustomer = nlapiLoadRecord('customer', customerID);
        recCustomer.setFieldValue('custentity_aic_date_reviewed', null);
        nlapiSubmitRecord(recCustomer);

         nlapiLogExecution('AUDIT', 'END --> Set Date Review | Customer: ' + customerID, ctx.getRemainingUsage());



    } catch (e) {
        var message = '';
        message += e;

        nlapiSendEmail(409635, ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'], 'AIC - Review - Date Review (SC) - Unable to run the script', message, null);
    }
}