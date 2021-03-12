 /**
 * 
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * 
 * Description: 
 * @Last Modified by: Sruti Desai
 * 
 */

define(['N/error', 'N/runtime', 'N/search', 'N/url', 'N/record', 'N/format', 'N/email', 'N/currentRecord'],
function(error, runtime, search, url, record, format, email, currentRecord) {
    var baseURL = 'https://1048144.app.netsuite.com';
    if (runtime.EnvType == "SANDBOX") {
        baseURL = 'https://1048144-sb3.app.netsuite.com';
    }
    var role = runtime.getCurrentUser().role;
    var ctx = runtime.getCurrentScript();
    var currRec = currentRecord.get();

    var service;
    var price;
    var customer;
    var status;

    /**
     * On page initialisation
     */
    function pageInit() {
        service = currRec.getValue({
            fieldId: 'service'
        })
        price = currRec.getValue({
            fieldId: 'price'
        })
        customer = currRec.getValue({
            fieldId: 'customer'
        })
        status = currRec.getValue({
            fieldId: 'group_status'
        });
        category = currRec.getValue({
            fieldId: 'category'
        });
        global_locked = currRec.getValue({
            fieldId: 'locked'
        });

        if (global_locked == 'yes') {
            document.getElementById('tr_submitter').style.display = 'none';
            $('.inv_dropdown').prop('disabled', function(i, v) {
                return !v;
            });
        }

        $(document).on("change", ".inv_dropdown", function(e) {

            var discount_type = $(this).val();
            //IF THE DISCOUNT TYPE IS $, SHOW THE DISCOUNT QTY
            if (discount_type == 1) {
                $(this).closest('tr').find('.invoiceable_border').addClass('has-success');
                $(this).closest('tr').find('.invoiceable_border').removeClass('has-error');
            } else {
                $(this).closest('tr').find('.invoiceable_border').removeClass('has-success');
                $(this).closest('tr').find('.invoiceable_border').addClass('has-error');
            }
        
        });
    }

    /**
    * [onclick_reset description] - Reload the page on click of the reset button 
    */
   function onclick_reset() {
       window.location.href = window.location.href;
   }

    function saveRecord(context) {

        var oldJobGroup = "";
        var assignPackage = currRec.getValue({
            fieldId: 'package' 
        });
        var packageID = currRec.getValue({
            fieldId: 'package_id'
        });

        var searchUsed = null;

        var discount_period = null;

        // inv_dropdown
        // var inv_dropdown_elem = document.getElementsByClassName("inv_dropdown");

        // for (var i = 0; i < inv_dropdown_elem.length; ++i) {
        // 	var initial_changed_qty = inv_dropdown_elem[i].value;
        // 	var initial_load_qty = inv_dropdown_elem[i].getAttribute("data-jobgroups");
        // }

        /**
         * [if description] -  if category is extras, search: Job - Invoicing Review - Invoicing Jobs
         * @param  {string} nlapiGetFieldValue('category') [description]
         */
        // if (nlapiGetFieldValue('category') == 'Extras') {
        // 	var searchedJobs = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs');
        // 	searchUsed = 1;
        // } else {
        /**
         * [if description] - If incoming status is 3, search: Job - Invoicing Review - Invoicing Jobs (Incomplete)
         * @param  {string} nlapiGetFieldValue('incoming_status') [description]
         */
        // if (nlapiGetFieldValue('incoming_status') == '3') {
        // 	var searchedJobs = nlapiLoadSearch('customrecord_job', 'customsearch_job_invoicing_jobs_inc');
        // 	searchUsed = 2;
        // } else {

            var searchedJobs = search.load({
                id: 'customsearch_job_invoicing_jobs',
                type: 'customrecord_job'
            });
        
        // 		searchUsed = 1;
        // 	}
        // }
        // 

        var fil = [];
        fil.push(['custrecord_job_customer',search.Operator.IS, customer]);
        fil.push(['custrecord_job_source',search.Operator.ANYOF, [1, 2, 3, 4,6]]);

        if (packageID == 'null' || isNullorEmpty(packageID)) {
            fil.push(['custrecord_job_service',search.Operator.IS, service]);
            fil.push(['custrecord_job_service_price',search.Operator.IS, price]);
            fil.push(['custrecord_job_service_package',search.Operator.ANYOF, '@NONE@']);
            if (currRec.getValue({ fieldId: 'category' }) == 'Services') {
                fil.push(['custrecord_job_group_status',search.Operator.IS, currRec.getValue({ fieldId: 'group_status'})]);
            }

        } else {
            var package_record = record.load({ type: 'customrecord_service_package', id: packageID});
            discount_period = package_record.getValue({ fieldId: 'custrecord_service_package_disc_period'});
            fil.push(['custrecord_job_service_package',search.Operator.ANYOF, packageID]);
            if (discount_period == 3) {
                fil.push(['custrecord_job_service',search.Operator.IS, service]);
                fil.push(['custrecord_job_service_price',search.Operator.IS, price]);
                fil.push(['custrecord_job_service_package',search.Operator.ANYOF, packageID]);
                if (currRec.getValue({ fieldId: 'category' }) == 'Services') {
                    fil.push(['custrecord_job_group_status',search.Operator.IS, currRec.getValue({ fieldId: 'group_status'})]);
                }
            } else {
                fil.push(['custrecord_package_status',search.Operator.IS, currRec.getValue({ fieldId: 'incoming_status'})]);
            }
        }
        if (!isNullorEmpty(currRec.getValue({ fieldId: 'start_date'})) && !isNullorEmpty(currRec.getValue({ fieldId: 'end_date'}))) {
            fil.push(['custrecord_job_date_scheduled', search.Operator.ONORAFTER, (currRec.getValue({ fieldId: 'start_date'}))]);
            fil.push(['custrecord_job_date_scheduled', search.Operator.ONORBEFORE, (currRec.getValue({ fieldId: 'end_date'}))]);
        }
        searchedJobs.filterExpression = fil;

        var resultSet = searchedJobs.run();

        var i = 0;

        var job_array = [];
        var invoiceable_array = [];
        var package_array = [];

        resultSet.each(function(searchResult){
            if (assignPackage == 'true') {
                var option = document.getElementById('package_assigned[' + i + ']');
            } else {
                var option = document.getElementById('invoiceable[' + i + ']');
            }
            var defaultOption = document.getElementById('default_value[' + i + ']');
    
            if (!isNullorEmpty(option) && !isNullorEmpty(defaultOption)) {
                var value = option.value;
                var defaultValue = defaultOption.value;


                if (value != defaultValue && value != 0) {

                    if (packageID == 'null' || isNullorEmpty(packageID) || discount_period == 3) {
                        var jobGroup = searchResult.getValue({ name: 'custrecord_job_group'});
                    } else {
                        var jobGroup = searchResult.getValue({ name: 'custrecord_package_job_groups'});
                        jobGroup = jobGroup.split(',');
                    }

                    // alert(jobGroup);
                    // if (searchUsed == 1) {
                    var searchedJobsExtras = search.load({
                        id: 'customsearch_job_invoicing_jobs',
                        type: 'customrecord_job'
                    });

                    // } else {
                    var searchedJobsExtras = search.load({ type: 'customrecord_job', id: 'customsearch_job_invoicing_jobs_inc'});
                    // }

                    var filPo = [];
                    filPo.push(['custrecord_job_customer', search.Operator.IS, customer]);
                    filPo.push(['custrecord_job_source', search.Operator.ANYOF, [1, 2, 3, 4, 6]]);
                    if (packageID == 'null' || isNullorEmpty(packageID) || discount_period == 3) {
                        filPo.push(['custrecord_job_service', search.Operator.IS, service]);
                        filPo.push(['custrecord_job_service_price', search.Operator.IS, price]);
                        if (currRec.getValue({ fieldId: 'category' }) == 'Services' && currRec.getValue({ fieldId: 'incoming_status'}) != 3) {
                            filPo.push(['custrecord_job_group_status', search.Operator.IS, currRec.getValue({ fieldId: 'group_status'})]);
                        }
                    }

                    if (!isNullorEmpty(jobGroup)) {
                        filPo.push(['custrecord_job_group', search.Operator.ANYOF, jobGroup]);
                    }

                    searchedJobsExtras.filterExpression = filPo;

                    var resultSetExtras = searchedJobsExtras.run();

                    if (!isNullorEmpty(jobGroup)) {
                        if (oldJobGroup != jobGroup) {
    
                            if (value != defaultValue && value != 0) {
    
                                // var count = 0;
                                resultSetExtras.each(function(searchResultExtras) {
    
                                    var jobID = searchResultExtras.getValue({ name: 'internalid'});
    
                                    if (typeof job_array[i] == 'undefined') {
                                        job_array[i] = [];
                                    }
                                    var job_len = job_array[i].length;
                                    job_array[i][job_len] = jobID;
    
                                    // console.log(invoiceable_array[i]);
    
                                    if (typeof package_array[i] == 'undefined') {
                                        package_array[i] = [];
                                    }
    
                                    if (typeof invoiceable_array[i] == 'undefined') {
                                        invoiceable_array[i] = [];
                                    }
    
                                    var pack_len = package_array[i].length;
                                    var inv_len = invoiceable_array[i].length;
    
                                    // var jobRecord = nlapiLoadRecord('customrecord_job', searchResultExtras.getValue('internalid'));
    
                                    if (assignPackage == 'true') {
                                        package_array[i][pack_len] = value
                                        // jobRecord.setValue({ fieldId: 'custrecord_job_service_package', value: value);
                                    } else {
                                        invoiceable_array[i][inv_len] = value;
                                        // jobRecord.setValue({ fieldId: 'custrecord_job_invoiceable', value: value);
                                    }
    
                                    // jobRecord.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate());
    
                                    // jobRecord.save();
                                    // count++;
                                    return true;
                                });
    
                                // alert(count);
                                // return false;
                            }
                        }
                        oldJobGroup = jobGroup;

                    } else {

                        var option = document.getElementById('package_assigned[' + i + ']');

                        if (!isNullorEmpty(option)) {
                            var value = option.value;
    
                            if (value == 0) {
                                // var count = 0;
                                resultSetExtras.each(function(searchResultExtras) {
    
                                    var jobID = searchResultExtras.getValue({ name: 'internalid' });
    
                                    if (typeof job_array[i] == 'undefined') {
                                        job_array[i] = [];
                                    }
                                    var job_len = job_array[i].length;
                                    job_array[i][job_len] = jobID;
    
                                    if (typeof package_array[i] == 'undefined') {
                                        package_array[i] = [];
                                    }
    
                                    // if(invoiceable_array[i] == 'undefined'){
                                    // 	invoiceable_array[i] = [];
                                    // }
    
                                    var pack_len = package_array[i].length;
                                    // var inv_len = invoiceable_array[i].length;
    
                                    package_array[i][pack_len] = null
    
                                    // var jobRecord = nlapiLoadRecord('customrecord_job', searchResultExtras.getValue('internalid'));
    
                                    // jobRecord.setFieldValue('custrecord_job_service_package', null);
    
                                    // nlapiSubmitRecord(jobRecord);
                                    return true;
                                });
                            } else {
                                resultSetExtras.each(function(searchResultExtras) {
                                    var jobID = searchResultExtras.getValue({ name: 'internalid' });
    
                                    if (typeof job_array[i] == 'undefined') {
                                        job_array[i] = [];
                                    }
                                    var job_len = job_array[i].length;
                                    job_array[i][job_len] = jobID;
    
                                    if (typeof package_array[i] == 'undefined') {
                                        package_array[i] = [];
                                    }
    
                                    // if(invoiceable_array[i] == 'undefined'){
                                    // 	invoiceable_array[i] = [];
                                    // }
    
                                    var pack_len = package_array[i].length;
                                    // var inv_len = invoiceable_array[i].length;
    
                                    package_array[i][pack_len] = value
    
                                    // package_array[i] = value;
    
                                    // var jobRecord = nlapiLoadRecord('customrecord_job', searchResultExtras.getValue('internalid'));
    
                                    // jobRecord.setFieldValue('custrecord_job_service_package', value);
    
                                    // nlapiSubmitRecord(jobRecord);
                                    return true;
                                });
                            }
                        } else {
                            if (value != defaultValue && value != 0) {

                                resultSetExtras.each(function(searchResultExtras) {
                                    var jobID = searchResultExtras.getValue({ name: 'internalid' });
    
                                    if (typeof job_array[i] == 'undefined') {
                                        job_array[i] = [];
                                    }
                                    var job_len = job_array[i].length;
                                    job_array[i][job_len] = jobID;
    
                                    if (typeof package_array[i] == 'undefined') {
                                        package_array[i] = [];
                                    }
    
                                    if (typeof invoiceable_array[i] == 'undefined') {
                                        invoiceable_array[i] = [];
                                    }
    
                                    var pack_len = package_array[i].length;
                                    var inv_len = invoiceable_array[i].length;
    
                                    // var jobRecord = nlapiLoadRecord('customrecord_job', searchResultExtras.getValue('internalid'));
    
                                    if (assignPackage == 'true') {
                                        package_array[i][pack_len] = value
                                        // jobRecord.setFieldValue('custrecord_job_service_package', value);
                                    } else {
                                        invoiceable_array[i][inv_len] = value;
                                        // jobRecord.setFieldValue('custrecord_job_invoiceable', value);
                                    }
    
                                    // jobRecord.setFieldValue('custrecord_job_date_reviewed', getDate());
    
                                    // nlapiSubmitRecord(jobRecord);
                                    // count++;
                                    return true;
                                });
                            }
                        }
                    }
                } else if (value == 0 && assignPackage == 'true' && value != defaultValue) {
                    resultSetExtras.each(function(searchResultExtras) {
    
                        var jobID = searchResultExtras.getValue({ name: 'internalid' });
    
                        if (typeof job_array[i] == 'undefined') {
                            job_array[i] = [];
                        }
                        var job_len = job_array[i].length;
                        job_array[i][job_len] = jobID;
    
                        if (typeof package_array[i] == 'undefined') {
                            package_array[i] = [];
                        }
    
                        // if(invoiceable_array[i] == 'undefined'){
                        // 	invoiceable_array[i] = [];
                        // }
    
                        var pack_len = package_array[i].length;
                        // var inv_len = invoiceable_array[i].length;
    
                        package_array[i][pack_len] = value
                        // var jobRecord = nlapiLoadRecord('customrecord_job', searchResultExtras.getValue('internalid'));
    
                        // if (assignPackage == 'true') {
                        // 	jobRecord.setFieldValue('custrecord_job_service_package', null);
                        // }
    
                        // jobRecord.setFieldValue('custrecord_job_date_reviewed', getDate());
    
                        // nlapiSubmitRecord(jobRecord);
    
                        return true;
                    });
                }
            }
            i++;
            return true;
        });

        // alert(package_array);
        // 
        // console.log(JSON.parse(job_array));
        // console.log(JSON.parse(package_array));
        // console.log(JSON.parse(invoiceable_array));

        currRec.setValue({
            fieldId: 'package_array',
            value: package_array.toString()
        });
        currRec.setValue({
            fieldId: 'job_array',
            value: job_array.toString()
        });
        currRec.setValue({
            fieldId: 'invoiceable_array',
            value: invoiceable_array.toString()
        });

        return true;
    }
    
    /**
     * [onclick_Back description] - Go back to the Review page
     */
    function onclick_Back() {

        var internalID = currRec.getValue({ fieldId: 'customer'});

        var uploadURL = baseURL + url.resolveScript({
            deploymentId: 'customdeploy_sl_services_main_page',
            scriptId: 'customscript_sl_services_main_page'
        }) + '&customer_id=' + internalID + '&start_date=' + currRec.getValue({ fieldId: 'start_date'}) + '&end_date=' + currRec.getValue({ fieldId: 'end_date'}) + '&locked=' + global_locked + '&sc=' + currRec.getValue({ fieldId: 'scid'}) + '&zee=' + currRec.getValue({ fieldId: 'zee_id'});

        window.open(uploadURL, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
    }

    function isNullorEmpty(strVal) {
        return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        
    };  
});