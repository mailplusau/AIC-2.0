 /**
 * 
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * 
 * Description: 
 * @Last Modified by: Anesu Chakaingesu
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
    

    var service;
    var price;
    var customer;
    var status;


    /**
     * On page initialisation
     */
    function pageInit() {
        var currRec = currentRecord.get();
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
    }

    function saveRecord(context) {
        var currRec = currentRecord.get();
        var old_job_group = "";
        var fil = [];  
        fil.push(['custrecord_job_service', search.Operator.IS, service]);
        fil.push(['custrecord_job_service_price', search.Operator.IS, price]);
        fil.push(['custrecord_job_customer', search.Operator.IS, customer]);
        if (!isNullorEmpty(currRec.getValue({ fieldId: 'group_status'}))) {
            fil.push(['custrecord_job_group_status', search.Operator.IS, currRec.getValue({ fieldId: 'group_status'})]);
        }
        if (!isNullorEmpty(currRec.getValue({ fieldId: 'start_date'})) && !isNullorEmpty(currRec.getValue({ fieldId: 'end_date'}))) {
            fil.push(['custrecord_job_date_scheduled', search.Operator.ONORAFTER, (currRec.getValue({ fieldId: 'start_date'}))]);
            fil.push(['custrecord_job_date_scheduled', search.Operator.ONORBEFORE, (currRec.getValue({ fieldId: 'end_date'}))]);
        }

        

        var poSearch = search.create({
            type: 'customrecord_job',
            columns: [
                'internalid',
                'custrecord_job_group'
            ]
        });
        poSearch.filterExpression = fil;

        poSearch.run();

        for (i = 0; i < poSearch.length; i++) {
            var job_group = poSearch[i].getValue('custrecord_job_group');

            var fil_po = [];
            fil_po.push(['custrecord_job_service', search.Operator.IS, service]);
            fil_po.push(['custrecord_job_service_price', search.Operator.IS, price]);
            fil_po.push(['custrecord_job_customer', search.Operator.IS, customer]);
            if (!isNullorEmpty(currRec.getValue({ fieldId: 'group_status' }))) {
                fil_po.push(['custrecord_job_group_status', search.Operator.IS, currRec.getValue({ fieldId: 'group_status'})]);
            }
            if (!isNullorEmpty(job_group)) {
                fil_po.push(['custrecord_job_group', search.Operator.IS, job_group]);
            }


            if (!isNullorEmpty(job_group)) {
                if (old_job_group != job_group) {
    
                    // alert(i)
                    var option = document.getElementById('package_assigned[' + i + ']');
                    var default_option = document.getElementById('default_value[' + i + ']');
                    var default_value = default_option.value;
                    var value = option.value;

                    var poResult = search.create({
                        type: 'customrecord_job',
                        columns: [
                            'internalid'
                        ]
                    });
                    poResult.filterExpression = fil_po;

                    if (value != default_value) {
                        if (value == 0) {
                            for (y = 0; y < poResult.length; y++) {
                                var job_record = record.submitFields({
                                    type: 'customrecord_job',
                                    id: poResult[y].getValue({ fieldId: 'internalid'}),
                                    values: { 
                                        'custrecord_job_service_package': value 
                                    }
                                });
                            }
                        }
                    }

                }
                old_job_group = job_group;
            } else {
                var option = document.getElementById('package_assigned[' + i + ']');

                var value = option.value;

                var poResult = search.create({
                    type: 'customrecord_job',
                    columns: [
                        'internalid'
                    ]
                });
                poResult.filterExpression = fil_po;
                
                if (value == 0) {
                    for (y = 0; y < poResult.length; y++) {
                        var job_record = record.submitFields({
                            type: 'customrecord_job',
                            id: poResult[y].getValue({ fieldId: 'internalid'}),
                            values: { 
                                'custrecord_job_service_package': value 
                            }
                        });
                    }
                } else {
                    for (y = 0; y < poResult.length; y++) {
                        var job_record = record.submitFields({
                            type: 'customrecord_job',
                            id: poResult[y].getValue({ fieldId: 'internalid'}),
                            values: { 
                                'custrecord_job_service_package': value 
                            }
                        });
                    }
                }
            }
        }

        return true;

        // window.opener.submit_package();
        // window.close();
    }

    function onclick_Back() {

        
        var upload_url = baseURL + url.resolveScript({
            deploymentId: 'customdeploy_sl_services_main_page',
            scriptId: 'customscript_sl_services_main_page' }) + '&customer_id=' + currRec.getValue({ fieldId: 'customer' }) + '&start_date=' + currRec.getValue({ fieldId: 'start_date'}) + '&end_date=' + currRec.getValue({ fieldId: 'end_date'});
        window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        
        // window.opener.submit_package();
        // window.close();
    
    }

    function isNullorEmpty(strVal) {
        return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord
    };  
});