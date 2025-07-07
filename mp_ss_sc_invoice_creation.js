/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * 
 * Module Description
 * 
 * @Last Modified by:   Sruti Desai
 * 
 */

define(['N/runtime', 'N/search', 'N/record', 'N/log', 'N/task', 'N/currentRecord', 'N/format'],
    function(runtime, search, record, log, task, currentRecord, format) {
        var zee = 0;
        var role = runtime.getCurrentUser().role;

        var usage_threshold = 30; //20
        var usage_threshold_invoice = 1000; //1000
        var adhoc_inv_deploy = 'customdeploy2';
        var prev_inv_deploy = null;
        var ctx = runtime.getCurrentScript();

        var service_start_date;
        var service_end_date;
        var franchisee;
        var from_invoice = null;
        var count_loop_cust = 0;

        var error_customers = [];
        var error_specialCustomers = [];

        function invoiceCreation() {
            log.audit({
                title: 'prev_deployment',
                details: ctx.getParameter({name:'custscript_prev_deployment'})
            })

            if (!isNullorEmpty(ctx.getParameter({name:'custscript_prev_deployment' }))) {
                prev_inv_deploy = ctx.getParameter({name:'custscript_prev_deployment' });
            } else {
                prev_inv_deploy = ctx.deploymentId;
            }

            var error_customers_string = ctx.getParameter({name: 'custscript_error_customers' });
            var error_special_customers_string = ctx.getParameter({name: 'custscript_error_special_customers' });

            if (!isNullorEmpty(error_customers_string)) {
                error_customers = error_customers_string.split(',');
            }

            if (!isNullorEmpty(error_special_customers_string)) {
                error_specialCustomers = error_customers_string.split(',');
            }

            log.audit({ title: 'Begining', details: 'Begining'});
            log.audit({ title: 'Customer', details: ctx.getParameter({name: 'custscript_customer_id' })});
            log.audit({ title: 'Invoice', details: ctx.getParameter({name: 'custscript_invoiceid' })});

            if (isNullorEmpty(ctx.getParameter({name: 'custscript_customer_id' })) && isNullorEmpty(ctx.getParameter({name: 'custscript_invoiceid' }))) {

                // nlapiLogExecution('DEBUG', 'START ---> ', ctx.getRemainingUsage());
        
                var searched_summary = search.load({
                    id: 'customsearch_job_inv_process_customer',
                    type: 'customrecord_job'
                })
        
                var resultSet_summary = searched_summary.run();
        
                resultSet_summary.each(function(searchResult_summary) {

                    var usage_loopstart_cust = ctx.getRemainingUsage();
                    count_loop_cust++;
        
                    log.debug({
                        title: 'START ---> Customer' + searchResult_summary.getText({ name: 'custrecord_job_customer', join: null, summary: search.Summary.GROUP }),
                        details: ctx.getRemainingUsage()
                    })
        
                    var customer_internal_id = searchResult_summary.getValue({ name: 'internalid', join: 'CUSTRECORD_JOB_CUSTOMER',summary: search.Summary.GROUP });
                    var special_customer_internal_id = searchResult_summary.getValue({ name: "custrecord_job_special_customer", join: null, summary: search.Summary.GROUP });
                    var customerPO = searchResult_summary.getValue({ name: "custentity11", join: "CUSTRECORD_JOB_CUSTOMER",summary: search.Summary.GROUP });
                    var specialCustomerPO = searchResult_summary.getValue({ name: "custentity11", join: "CUSTRECORD_JOB_SPECIAL_CUSTOMER",summary: search.Summary.GROUP });
                    service_start_date = searchResult_summary.getValue({ name: "custrecord_job_date_scheduled", join: null, summary: search.Summary.MIN});
                    service_end_date = searchResult_summary.getValue({ name: "custrecord_job_date_scheduled", join: null, summary: search.Summary.MAX});
        
                    log.debug({
                        title: 'special_customer_internal_id',
                        details: special_customer_internal_id
                    });

                    var result_customer = error_customers.indexOf(customer_internal_id);
                    var result_specialCustomer = error_specialCustomers.indexOf(special_customer_internal_id);

                    //If the current customer is not present in the Error Customer array and Current Special Customer is not present in the Error Special Customer array, then continue creating invoice, else skip. 

                    if (result_customer == -1 && result_specialCustomer == -1) {
                        /*
                        To check if the Job - Invoicing Review - Invoiceable Discrepancies search for the customer, if present do not run the allocator
                        */
                        var searched_job_group_inv_review_descp = search.load({
                            id: 'customsearch_job_inv_review_inv_discrep',
                            type: 'customrecord_job'
                        })

                        searched_job_group_inv_review_descp.filters.push(search.createFilter({
                            name: 'custrecord_job_customer',
                            operator: search.Operator.IS,
                            values: customer_internal_id,
                        }));

                        
                        if (!isNullorEmpty(service_start_date) && !isNullorEmpty(service_end_date)) {

                            searched_job_group_inv_review_descp.filters.push(search.createFilter({
                                name: 'custrecord_job_date_scheduled',
                                operator: search.Operator.ONORAFTER,
                                values: format.parse({ value: service_start_date, type: format.Type.DATE })
                            }));
                            searched_job_group_inv_review_descp.filters.push(search.createFilter({
                                name: 'custrecord_job_date_scheduled',
                                operator: search.Operator.ONORBEFORE,
                                values: format.parse({ value: service_end_date, type: format.Type.DATE }),
                            }));

                        }

				        var resultSet_job_group_inv_review_descp = searched_job_group_inv_review_descp.run();

				        var result_job_group_inv_review_descp = resultSet_job_group_inv_review_descp.getRange({
                            start: 0,
                            end: 1
                        });

                    

                        /*
                            If Empty and result is 0, then the package allocator runs
                        */
                        try {
                            if (result_job_group_inv_review_descp.length == 0) {

                                if (ctx.getRemainingUsage() <= usage_threshold_invoice) {

                                    var params = {
                                        custscript_prev_deployment: ctx.deploymentId,
                                        custscript_error_customers: error_customers.join(','),
                                        custscript_error_special_customers: error_specialCustomers.join(',')
                                    }

                                    var reschedule = task.create({
                                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                                        scriptId: prev_inv_deploy,
                                        deploymentId: adhoc_inv_deploy,
                                        params: params
                                    });
                                    
                                    reschedule.submit();

                                    if (reschedule == false) {
                                        return false;
                                    }

                                }
                                    
                                var customer_name = searchResult_summary.getText({ name: 'custrecord_job_customer', join: null, summary: search.Summary.GROUP });
                                var date_reviewed = searchResult_summary.getValue({ name: 'custrecord_job_date_reviewed',join: null, summary: search.Summary.GROUP });
                                // var invoiceable = searchResult_summary.getValue({ name: 'custrecord_job_invoiceable',join: null, summary: search.Summary.GROUP');
                                var date_finalised = searchResult_summary.getValue({ name: 'custrecord_job_date_inv_finalised',join: null, summary: search.Summary.GROUP });
                                var count_jobs_invoiceable = searchResult_summary.getValue({ name: 'formulanumeric',join: null, summary: search.Summary.SUM });
                                var zee_text = searchResult_summary.getValue({ name: 'formulatext',join: null, summary: search.Summary.GROUP });
                                // franchisee = searchResult_summary.getValue({ name: "custrecord_service_franchisee",join: "CUSTRECORD_JOB_SERVICE" summary: search.Summary."GROUP");
                                var count_jobs = searchResult_summary.getValue({ name: 'internalid',join: null, summary: search.Summary.COUNT });
                                service_start_date = searchResult_summary.getValue({ name: "custrecord_job_date_scheduled",join: null, summary: search.Summary.MIN });
                                service_end_date = searchResult_summary.getValue({ name: "custrecord_job_date_scheduled",join: null, summary: search.Summary.MAX });

                                log.debug({
                                    title: 'zee text',
                                    details: zee_text
                                });

                                //Get the Franchisee Name (Text field) from the customer search and get the internal id from the search customsearch_job_inv_process_zee
                                //
                                var searched_zee = search.load({
                                    id: 'customsearch_job_inv_process_zee',
                                    type: search.Type.PARTNER
                                });

                                searched_zee.filters.push(search.createFilter({
                                    name: 'entityid',
                                    operator: search.Operator.IS,
                                    values: zee_text
                                }));

                                var resultSet_zee = searched_zee.run();
                                var count_zee = 0;
                                var zee_id;

                                resultSet_zee.each(function(searchResult_zee) {

                                    zee_id = searchResult_zee.getValue('internalid');
                                    count_zee++;
                                    return true;
                                });

                                if (count_zee == 0) {

                                    //WS Log: Error
        
                                    var body = 'No zee set for customer ' + customer_internal_id;
                                    
                                    email.send({
                                        author: 409635,
                                        body: body,
                                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                                        subject: 'Invoice Creation - Empty Zee for Invoicing',
                                    });

                                    return false;
                                } else {
                                    franchisee = zee_id;
                                }

                                // 
                                log.debug({
                                    title: 'Franchisee',
                                    details: franchisee
                                })

                                // var customerRec = nlapiLoadRecord('customer', customer_internal_id);
                                // nlapiLogExecution('DEBUG', 'END OF ZEE', '');

                                if (!isNullorEmpty(date_reviewed) && count_jobs_invoiceable == 0 && !isNullorEmpty(date_finalised)) {
                                    log.debug({
                                        title: 'START OF INVOICE CREATION',
                                        details: ''
                                    })

                                    
                                    recInvoice = record.create({
                                        type: record.Type.INVOICE,
                                        isDynamic: true,
                                    })
                                    
                                    
                                    recInvoice.setValue({ fieldId: 'customform', value: 116 });
                                    if (isNullorEmpty(special_customer_internal_id)) {
                                        recInvoice.setValue({ fieldId: 'entity', value: customer_internal_id });
                                        if (!isNullorEmpty(customerPO)) {
                                            recInvoice.setValue({ fieldId: 'custbody6', value: customerPO });
                                        }
                                    } else {
                                        recInvoice.setValue({ fieldId: 'entity', value: special_customer_internal_id });
                                        if (!isNullorEmpty(specialCustomerPO)) {
                                            recInvoice.setValue({ fieldId: 'custbody6', value: specialCustomerPO });
                                        }
                                    }

                                    
                                    recInvoice.setValue({ fieldId: 'department', value: record.load({ type: record.Type.PARTNER, id: franchisee }).getValue({ fieldId: 'department' }) });
                                    recInvoice.setValue({ fieldId: 'location', value: record.load({ type: record.Type.PARTNER, id: franchisee }).getValue({ fieldId: 'location' }) });
                                    // recInvoice.setValue({ fieldId: 'trandate', value: invoice_date() });
                                    recInvoice.setValue({ fieldId: 'trandate', value: '31/07/2021' });
                                    recInvoice.setValue({ fieldId: 'custbody_dont_update_trandate', value: "T" });
                                    recInvoice.setValue({ fieldId: 'custbody_inv_date_range_from', value: service_start_date });
                                    recInvoice.setValue({ fieldId: 'custbody_inv_date_range_to', value: service_end_date });

                                    recInvoice.setValue({ fieldId: 'partner', value: franchisee });


                                    recInvoice.setValue({ fieldId: 'terms', value: 1 });

                                    log.debug({
                                        title: 'START OF SINGLE LINE SEARCH',
                                        details: ''
                                    });

                                    var searched_singleline_discount_jobs = search.load({
                                        id: 'customsearch_job_inv_process_disc_single',
                                        type: 'customrecord_job'
                                    })

                                    var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";

                                    if (isNullorEmpty(special_customer_internal_id)) {
                                        
                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_customer',
                                            operator: search.Operator.IS,
                                            values: customer_internal_id
                                        }));

                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_special_customer',
                                            operator: search.Operator.IS,
                                            values: '@NONE@'
                                        }));

                                    } else {
                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_customer',
                                            operator: search.Operator.IS,
                                            values: customer_internal_id
                                        }));

                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_special_customer',
                                            operator: search.Operator.IS,
                                            values: special_customer_internal_id
                                        }));
                                    }

                                    searched_singleline_discount_jobs.filters.push(search.createFilter({
                                        name: 'formulatext',
                                        operator: search.Operator.IS,
                                        values: zee_text,
                                        formula: strFormula
                                    }));

                                    if (!isNullorEmpty(service_start_date) && !isNullorEmpty(service_end_date)) {

                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORAFTER,
                                            values: format.parse({ value: service_start_date, type: format.Type.DATE }),
                                        }));

                                        
                                        searched_singleline_discount_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORBEFORE,
                                            values: format.parse({ value: service_end_date, type: format.Type.DATE }),
                                        }));

                                    }


                                    var resultSet_singleline_jobs = searched_singleline_discount_jobs.run();

                                    var single_line_packages = [];
                                    var i = 0;

                                    var global_inv_line_count = 0;

                                    resultSet_singleline_jobs.each(function(searchResult_singleline_jobs) {

                                        log.debug({
                                            title: 'INSIDE SINGLE LINE SEARCH',
                                            details: ''
                                        })
        
                                        var total_qty = searchResult_singleline_jobs.getValue('custrecord_job_extras_qty');
                                        var service_rate = searchResult_singleline_jobs.getValue('custrecord_job_service_price');
                                        var discount_detail = searchResult_singleline_jobs.getValue('custrecord_job_invoice_detail');
                                        var ns_item_package = searchResult_singleline_jobs.getValue({ name: 'custrecord_service_package_ns_item', join: 'CUSTRECORD_JOB_SERVICE_PACKAGE' });
                                        var package_type = searchResult_singleline_jobs.getValue({ name: 'custrecord_service_package_type', join: 'CUSTRECORD_JOB_SERVICE_PACKAGE' });
                                        single_line_packages[i] = searchResult_singleline_jobs.getValue('custrecord_job_service_package');
        
                                        log.debug({
                                            title: 'NS ITEM PACKAGE',
                                            details: ns_item_package
                                        })
        
                                        if (package_type != 1) {
                                            if (isNullorEmpty(ns_item_package)) {
                                                ns_item_package = 66;
                                            }
        
                                            if (!isNullorEmpty(discount_detail)) {
                                                var inv_details_rec = record.create({
                                                    type: 'customrecord62'
                                                })

                                                inv_details_rec.setValue({ fieldId: 'name', value: discount_detail });
                                                inv_details_rec.setValue({ fieldId: 'custrecord57_2', value: customer_internal_id });
                                                inv_details_rec.setValue({ fieldId: 'custrecord56_2', value: ns_item_package });
                                                var inv_details_rec_id = inv_details_rec.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: true
                                                })
                                            }
        
                                            recInvoice.selectNewLine({
                                                sublistId: 'item'
                                            });

                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: ns_item_package,
                                            });

                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: total_qty,
                                            });

                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                value: service_rate,
                                            });

        
                                            if (!isNullorEmpty(inv_details_rec_id)) {
                                                item_desc = record.load({
                                                    type: 'customrecord62',
                                                    id: inv_details_rec_id
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol1',
                                                    value: inv_details_rec_id,
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol1_display',
                                                    value: item_desc.getValue({ fieldId: 'name' }),
                                                });

                                            }
    
                                            log.debug({
                                                title:  'NS ITEM PACKAGE',
                                                details: ns_item_package
                                            })

                                            recInvoice.commitLine({ sublistId: 'item'})

                                            i++;
                                            global_inv_line_count++;
                                        }
                                        return true;
                                    });

                                    log.debug({
                                        title: 'START OF INVOICEABLE SEARCH',
                                        details: ''
                                    })


                                    var searched_jobs = search.load({
                                        id: 'customsearch_job_inv_process_job_inv_yes',
                                        type: 'customrecord_job'
                                    })

                                    if (isNullorEmpty(special_customer_internal_id)) {

                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_customer',
                                            operator: search.Operator.IS,
                                            values: customer_internal_id,
                                        }));

                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_special_customer',
                                            operator: search.Operator.IS,
                                            values: '@NONE@',
                                        }));

                                    } else {
                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_customer',
                                            operator: search.Operator.IS,
                                            values: customer_internal_id,
                                        }));
                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_special_customer',
                                            operator: search.Operator.IS,
                                            values: special_customer_internal_id,
                                        }));

                                    }

                                    searched_jobs.filters.push(search.createFilter({
                                        name: 'formulatext',
                                        operator: search.Operator.IS,
                                        values: zee_text,
                                        formula: strFormula
                                    }));

                                    if (!isNullorEmpty(single_line_packages)) {
                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_service_package',
                                            operator: search.Operator.NONEOF,
                                            values: single_line_packages,
                                        }));
                                    }
                                    if (!isNullorEmpty(service_start_date) && !isNullorEmpty(service_end_date)) {

                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORAFTER,
                                            values: format.parse({value: service_start_date, type: format.Type.DATE }),
                                        }));

                                        searched_jobs.filters.push(search.createFilter({
                                            name: 'custrecord_job_date_scheduled',
                                            operator: search.Operator.ONORBEFORE,
                                            values: zee_text,
                                            formula: format.parse({value: service_end_date, type: format.Type.DATE })
                                        }));

                                    }

                                    var resultSet_jobs = searched_jobs.run();

                                    var total_qty = 0;
                                    var old_total_qty = 0;
                                    var date_finalised;
                                    var total_amount = 0;
                                    var old_total_amount = 0;
                                    var old_service_rate = 0;

                                    var old_package_id = null;
                                    var old_service_id = null;
                                    var old_ns_item_id = null;
                                    var old_service_rate = null;
                                    var old_inv_details_rec_id = null;
                                    var old_invoice_single_line = null;
                                    var discount_value = null;
                                    var discount_set_type = null;
                                    var discount_detail = null;

                                    var count = 0;

                                    resultSet_jobs.each(function(searchResult_jobs) {

                                        log.debug({
                                            title: 'INSIDE OF INVOICEABLE SEARCH',
                                            details: ''
                                        })
        
                                        var customer_internal_id = (searchResult_jobs.getValue({ name: 'internalid', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP }));
                                        var customer_name = searchResult_jobs.getText({ name: 'custrecord_job_customer', join: null, summary: search.Summary.GROUP });
                                        //use the internal id of the service iunstead of the service name
                                        var service_id = (searchResult_jobs.getValue({ name: 'custrecord_job_service', join: null, summary: search.Summary.GROUP }));
                                        var service_rate = searchResult_jobs.getValue({ name: 'custrecord_job_service_price', join: null, summary: search.Summary.GROUP });
                                        var count_service = (searchResult_jobs.getValue({ name: 'formulacurrency', join: null, summary: search.Summary.SUM }));
                                        var discount_id = (searchResult_jobs.getValue({ name: 'formulanumeric', join: null, summary: search.Summary.GROUP }));
                                        var package_id = (searchResult_jobs.getValue({ name: 'custrecord_job_service_package', join: null, summary: search.Summary.GROUP }));
                                        var count_extras = (searchResult_jobs.getValue({ name: 'custrecord_job_extras_qty', join: null, summary: search.Summary.SUM }));
                                        var invoice_single_line = searchResult_jobs.getValue({ name: 'custrecord_job_invoice_single_line_item', join: null, summary: search.Summary.GROUP });
                                        var invoice_detail = searchResult_jobs.getValue({ name: 'custrecord_job_invoice_detail', join: null, summary: search.Summary.GROUP });
                                        if (!isNullorEmpty(searchResult_jobs.getValue({ name: 'custrecord_job_date_finalised', join: null, summary: search.Summary.MAX }))) {
                                            date_finalised = searchResult_jobs.getValue({ name: 'custrecord_job_date_finalised', join: null, summary: search.Summary.MAX });
                                        }
        
                                        var service_record = record.load({
                                            type: 'customrecord_service',
                                            id: service_id
                                        });

        
                                        var service_type_id = service_record.getValue({ fieldId: 'custrecord_service' });
        
                                        var service_type_record = record.load({
                                            type: 'customrecord_service_type',
                                            id: service_type_id,
                                        })
        
                                        var ns_item_id = service_type_record.getValue({ fieldId: 'custrecord_service_type_ns_item' });
        
                                        //nlapiLogExecution('DEBUG','count_service', count_service);
                                        //nlapiLogExecution('DEBUG','count_extras', count_extras);
        
                                        if (isNullorEmpty(count_service) || count_service == .00) {
                                            count_service = 0;
                                        }
        
                                        if (isNullorEmpty(count_extras)) {
                                            count_extras = 0;
                                        }
        
                                        //nlapiLogExecution('DEBUG','count_service', count_service);
                                        //nlapiLogExecution('DEBUG','count_extras', count_extras);
        
        
                                        if (count == 0) {
        
                                            total_qty = parseInt(count_service) + parseInt(count_extras);
                                            if (!isNullorEmpty(invoice_detail) && invoice_detail != "- None -") {
                                                var inv_details_rec = record.create({
                                                    type: 'customrecord62'
                                                });

                                                inv_details_rec.setFieldValue({ fieldId: 'name', value: invoice_detail });
                                                inv_details_rec.setFieldValue({ fieldId: 'custrecord57_2', value: customer_internal_id });
                                                inv_details_rec.setFieldValue({ fieldId: 'custrecord56_2', value: ns_item_id });
                                                var inv_details_rec_id = inv_details_rec.save({
                                                    enableSourcing: true,
                                                    ignoreMandatoryFields: true
                                                });

                                            }
                                        } else {
                                            if (old_service_id != service_id) {
        
                                                recInvoice.selectNewLine({
                                                    sublistId: 'item'
                                                })
        
                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'item',
                                                    value: old_ns_item_id,
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'quantity',
                                                    value: old_total_qty,
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'rate',
                                                    value: old_service_rate,
                                                });
        
                                                if (!isNullorEmpty(old_inv_details_rec_id)) {
                                                    item_desc = record.load({
                                                        type: 'customrecord62',
                                                        id: old_inv_details_rec_id
                                                    });

                                                    recInvoice.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol1',
                                                        value: old_inv_details_rec_id,
                                                    });

                                                    recInvoice.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'custcol1_display',
                                                        value: item_desc.getValue({ fieldId: 'name' }),
                                                    });


                                                }

                                                recInvoice.commitLine({
                                                    sublistId: 'item',
                                                })
        
                                                //Start of new item
                                                old_total_qty = 0;
                                                total_qty = 0;
                                                total_qty = parseInt(count_service) + parseInt(count_extras);
                                                if (!isNullorEmpty(invoice_detail) && invoice_detail != "- None -") {
                                                    var inv_details_rec = record.create({
                                                        type: 'customrecord62',
                                                    })

                                                    inv_details_rec.setValue({ fieldId: 'name', value: invoice_detail });
                                                    inv_details_rec.setValue({ fieldId: 'custrecord57_2', value: customer_internal_id });
                                                    inv_details_rec.setValue({ fieldId: 'custrecord56_2', value: ns_item_id });
                                                    var inv_details_rec_id = inv_details_rec.save({
                                                        enableSourcing: true,
                                                        ignoreMandatoryFields: true
                                                    })
                                                }
                                            } else {
                                                if (old_service_rate != service_rate) {
                                                    recInvoice.selectNewLine({
                                                        sublistId: 'item'
                                                    })
        
                                                    recInvoice.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'item',
                                                        value: old_ns_item_id,
                                                    });


                                                    recInvoice.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'quantity',
                                                        value: old_total_qty,
                                                    });

                                                    recInvoice.setCurrentSublistValue({
                                                        sublistId: 'item',
                                                        fieldId: 'rate',
                                                        value: old_service_rate,
                                                    });
        
                                                    if (!isNullorEmpty(old_inv_details_rec_id)) {
                                                        item_desc = record.load({
                                                            type: 'customrecord62',
                                                            id: old_inv_details_rec_id,
                                                        });

                                                        recInvoice.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol1',
                                                            value: old_inv_details_rec_id,
                                                        });

                                                        recInvoice.setCurrentSublistValue({
                                                            sublistId: 'item',
                                                            fieldId: 'custcol1_display',
                                                            value: item_desc.getValue({ fieldId: 'name' }),
                                                        });

                                                    }
                                                    recInvoice.commitLine({
                                                        sublistId: 'item',
                                                    })
        
                                                    //Start of new item
                                                    old_total_qty = 0;
                                                    total_qty = 0;
                                                    total_qty = parseInt(count_service) + parseInt(count_extras);
                                                    if (!isNullorEmpty(invoice_detail) && invoice_detail != "- None -") {
                                                        var inv_details_rec = record.create({
                                                            type: 'customrecord62',
                                                        })

                                                        inv_details_rec.setValue({ fieldId: 'name', value: invoice_detail });
                                                        inv_details_rec.setValue({ fieldId: 'custrecord57_2', value: customer_internal_id });
                                                        inv_details_rec.setValue({ fieldId: 'custrecord56_2', value: ns_item_id });
                                                        var inv_details_rec_id = inv_details_rec.save({
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: true
                                                        });
                                                    }
                                                } else {
                                                    total_qty = parseInt(count_service) + parseInt(count_extras);
                                                    if (!isNullorEmpty(invoice_detail) && invoice_detail != "- None -") {
                                                        var inv_details_rec = record.create({
                                                            type: 'customrecord62',
                                                        });

                                                        inv_details_rec.setValue({ fieldId: 'name', value: invoice_detail });
                                                        inv_details_rec.setValue({ fieldId: 'custrecord57_2', value: customer_internal_id });
                                                        inv_details_rec.setValue({ fieldId: 'custrecord56_2', value: ns_item_id });
                                                        var inv_details_rec_id = inv_details_rec.save({
                                                            enableSourcing: true,
                                                            ignoreMandatoryFields: true
                                                        })
                                                    }
                                                }
        
                                            }
                                        }
        
        
                                        count++;
                                        global_inv_line_count++;
        
                                        old_package_id = searchResult_jobs.getValue({ name: 'custrecord_job_service_package', join: null, summary: search.Summary.GROUP });
                                        old_service_id = searchResult_jobs.getValue({ name: 'custrecord_job_service', join: null, summary: search.Summary.GROUP });
                                        old_ns_item_id = ns_item_id;
                                        old_service_rate = searchResult_jobs.getValue({ name: 'custrecord_job_service_price', join: null, summary: search.Summary.GROUP });
                                        old_inv_details_rec_id = inv_details_rec_id;
                                        old_invoice_single_line = searchResult_jobs.getValue({ name: 'custrecord_job_invoice_single_line_item', join: null, summary: search.Summary.GROUP });
                                        old_total_qty += parseInt(total_qty);
        
                                        //nlapiLogExecution('DEBUG','old_total_qty', old_total_qty);
        
                                        return true;
                                    });

                                    if (ctx.getRemainingUsage() <= usage_threshold_invoice) {

                                        var params = {
                                            custscript_prev_deployment: ctx.deploymentId,
                                            custscript_error_customers: error_customers.join(','),
                                            custscript_error_special_customers: error_specialCustomers.join(',')
                                        }
        
                                        var reschedule = task.create({
                                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                                            scriptId: prev_inv_deploy,
                                            deploymentId: adhoc_inv_deploy,
                                            params: params
                                        });
                                        
                                        reschedule.submit();

                                        if (reschedule == false) {
        
                                            return false;
                                        }
                                    } else {
                                        if (count >= 1) {
        
                                            recInvoice.selectNewLine({
                                                sublistId: 'item'
                                            });
        
                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'item',
                                                value: old_ns_item_id,
                                            });

                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'quantity',
                                                value: old_total_qty,
                                            });

                                            recInvoice.setCurrentSublistValue({
                                                sublistId: 'item',
                                                fieldId: 'rate',
                                                value: old_service_rate,
                                            });
                                            
        
                                            if (!isNullorEmpty(old_inv_details_rec_id)) {
                                                item_desc = record.load({
                                                    type: 'customrecord62',
                                                    id: old_inv_details_rec_id
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol1',
                                                    value: old_inv_details_rec_id,
                                                });

                                                recInvoice.setCurrentSublistValue({
                                                    sublistId: 'item',
                                                    fieldId: 'custcol1_display',
                                                    value: item_desc.getValue({fieldId: 'name' }),
                                                });

                                            }

                                            recInvoice.commitLine({
                                                sublistId: 'item',
                                            })
        
                                            var invoiceId = recInvoice.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: true
                                            })
        
                                            //WS Log:
                                            log.audit({
                                                title: 'Cust #: ' + count_loop_cust + ' | Cust ID: ' + customer_internal_id + ' | INV ID: ' + invoiceId + '.',
                                                details: usage_loopstart_cust - ctx.getRemainingUsage()
                                            });
        
                                            // nlapiLogExecution('DEBUG', 'START ---> after invoice creation', ctx.getRemainingUsage());
                                        } else if (count == 0 && global_inv_line_count >= 1) {
                                            var invoiceId = recInvoice.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: true
                                            })
        
                                            //WS Log:
                                            log.audit({
                                                title: 'Cust #: ' + count_loop_cust + ' | Cust ID: ' + customer_internal_id + ' | INV id: ' + invoiceId + '.',
                                                details: usage_loopstart_cust - ctx.getRemainingUsage()
                                            });
        
                                        } else if (global_inv_line_count == 0 && count == 0) {
                                            var invoiceId = null;
                                        }
        
                                        var result = updateJobs(customer_internal_id, invoiceId, service_start_date, service_end_date, franchisee, null, special_customer_internal_id, zee_text);
                                        log.audit({
                                            title: 'Return value 1',
                                            details: result
                                        })
                                        return result;
                                    }

                                } else {
                                    var body = 'Cannot Finalize Invoicing For ' + customer_name + '. Either Date Reviewed or Date Finalized is not set OR the count of the Jobs with no Invoiceable field set is not 0 ';

                                    email.send({
                                        author: 409635,
                                        body: body,
                                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                                        subject: 'Invoice Process - Creation'
                                    });

                                }

                                return true;

                            } else {
                               //WS Log: Error

						        var body = 'Customer: ' + customer_internal_id + ' cannot be invoiced because it has Job Discrepancies present. Search : Job - Invoicing Review - Invoiceable Discrepancies';
                                email.send({
                                    author: 409635,
                                    body: body,
                                    recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                                    subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot be Invoiced',
                                });
					 
                            }
                        } catch(e) {
                            error_customers[error_customers.length] = customer_internal_id;

                            if (!isNullorEmpty(special_customer_internal_id)) {
                                error_specialCustomers[error_specialCustomers.length] = special_customer_internal_id;
                            }
        
                            var message = '';
                            message += "Customer Internal ID: " + customer_internal_id + "</br>";
                            message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customer_internal_id + "'> View Customer </a></br>";
                            message += "----------------------------------------------------------------------------------</br>";
                            // message += "Job: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=941&id=" + job_id + "'> View Job </a></br>";
                            message += "----------------------------------------------------------------------------------</br>";
                            message += e;
        
        
                            email.send({
                                author: 409635,
                                body: message,
                                recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                                subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot create Invoice',
                            });
                        
                        }
                    }
                    
                    return true;
                        
                });

            } else {

                service_start_date = ctx.getParameter({ name: 'custscript_service_start_date' });
                service_end_date = ctx.getParameter({ name: 'custscript_service_end_date' });
                franchisee = ctx.getParameter({ name: 'custscript_zee' });
                zee_text = ctx.getParameter({ name: 'custscript_zee_text' });
                from_invoice = ctx.getParameter({ name: 'custscript_from_invoice' });

                
                log.audit({ title: 'Inside Else to Update jobs' });
                log.audit({ title: 'Customer', details: ctx.getParameter({ name: 'custscript_customer_id' }) });
                log.audit({ title: 'Invoice', details: ctx.getParameter({ name: 'custscript_invoiceid' }) });

                var result = updateJobs(ctx.getParameter({ name: 'custscript_customer_id' }), ctx.getParameter({ name: 'custscript_invoiceid' }), service_start_date, service_end_date, franchisee, from_invoice, ctx.getParameter({ name: 'custscript_special_customer_id' }), zee_text);
                log.audit({
                    title: 'Return value 2',
                    details: result
                })

                if (result == true && from_invoice != 'Yes') {

                    log.audit({
                        title: 'To continue with Next customer after Job Update',
                        details: 'To continue with Next customer after Job Update'
                    })

                    var params = {
                        custscript_prev_deployment: ctx.deploymentId,
                        custscript_error_customers: error_customers.join(','),
                        custscript_error_special_customers: error_specialCustomers.join(','),
                    }

                    var reschedule = task.create({
                        taskType: task.TaskType.SCHEDULED_SCRIPT,
                        scriptId: prev_inv_deploy,
                        deploymentId: adhoc_inv_deploy,
                        params: params
                    });
                    
                    reschedule.submit();

                    if (reschedule == false) {

                        return false;
                    }
                }
            }
        }

        function updateJobs(customer_internal_id, invoiceId, service_start_date, service_end_date, franchisee, from_invoice, special_customer_internal_id, zee_text) {

            var count_loop_job = 0;
        
            var strFormula = "COALESCE({custrecord_job_service.custrecord_service_franchisee},{custrecord_job_group.custrecord_jobgroup_franchisee},{custrecord_job_franchisee},'')";
        
            if (from_invoice == 'Yes') {
                var searched_alljobs = search.load({
                    id: 'customsearch_job_invoicing_jobs',
                    type: 'customrecord_job'
                })

                var zee_record = record.load({
                    type: record.Type.PARTNER,
                    id: franchisee
                });
        
                zee_text = zee_record.getValue({ fieldId: 'entitytitle' });
            } else {
                var searched_alljobs = search.load({
                    id: 'customsearch_job_inv_process_job_all',
                    type: 'customrecord_job'
                });
            }
        

            searched_alljobs.filters.push(search.createFilter({
                name: 'custrecord_job_customer',
                operator: search.Operator.IS,
                values: customer_internal_id,
            }));

            if (!isNullorEmpty(special_customer_internal_id)) {
                log.debug({
                    title: 'special_customer_internal_id',
                    details: special_customer_internal_id
                })

                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_special_customer',
                    operator: search.Operator.IS,
                    values: special_customer_internal_id,
                }));

            } else {
                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_special_customer',
                    operator: search.Operator.IS,
                    values: '@NONE@',
                }));

            }
            searched_alljobs.filters.push(search.createFilter({
                name: 'formulatext',
                operator: search.Operator.IS,
                values: zee_text,
                formula: strFormula
            }));

            if (!isNullorEmpty(service_start_date) && !isNullorEmpty(service_end_date)) {
                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_date_scheduled',
                    operator: search.Operator.ONORAFTER,
                    values: format.parse({value: service_start_date, type: format.Type.DATE }),
                }));

                searched_alljobs.filters.push(search.createFilter({
                    name: 'custrecord_job_date_scheduled',
                    operator: search.Operator.ONORBEFORE,
                    values: format.parse({value: service_end_date, type: format.Type.DATE }),
                }));
            }
                
            var resultSet_alljobs = searched_alljobs.run();
        
            var reschedule;
        
            resultSet_alljobs.each(function(searchResult_alljobs) {
        
                var usage_loopstart_job = ctx.getRemainingUsage();
                count_loop_job++;
        
        
                //nlapiLogExecution('DEBUG', 'START ---> usage remianing per loop of job update', ctx.getRemainingUsage());
                try {
                    if (ctx.getRemainingUsage() <= usage_threshold) {
        
                        log.audit({ title: 'switch inside Job Update', details: 'switch inside Job Update' });
                        log.audit({ title: 'Job Update | Customer', details: customer_internal_id });
                        log.audit({ title: 'Job Update | Invoice', details: invoiceId });
        
                        var params = {
                            custscript_customer_id: customer_internal_id.toString(),
                            custscript_invoiceid: invoiceId.toString(),
                            custscript_prev_deployment: ctx.getDeploymentId(),
                            custscript_service_start_date: service_start_date.toString(),
                            custscript_service_end_date: service_end_date.toString(),
                            custscript_zee: franchisee.toString(),
                            custscript_special_customer_id: special_customer_internal_id,
                            custscript_error_customers: error_customers.join(','),
                            custscript_error_special_customers: error_specialCustomers.join(','),
                            custscript_zee_text: zee_text
                        }
        
                        var reschedule = task.create({
                            taskType: task.TaskType.SCHEDULED_SCRIPT,
                            scriptId: prev_inv_deploy,
                            deploymentId: adhoc_inv_deploy,
                            params: params
                        });
                        
                        reschedule.submit();

                        log.audit({
                            title: 'Reschedule Return',
                            details: reschedule
                        })
                        if (reschedule == false) {
                            return false;
                        }
                    }
        
        
                    var job_id = searchResult_alljobs.getValue('internalid');
                    var invoiceable_yes_no = searchResult_alljobs.getValue('custrecord_job_invoiceable');
        
                    var job_record = record.load({
                        type: 'customrecord_job',
                        id: job_id
                    })
        
                    // job_record.getFieldValue('custrecord_job_date_invoiced') != getDate()
                    if (isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_date_invoiced' })) && isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_invoice' }))) {
        
        
                        if (from_invoice == 'Yes') {
        
                            var jobGroupStatus = job_record.getValue({ fieldId: 'custrecord_job_group_status' });
                            var jobInvoiceable = job_record.getValue({ fieldId: 'custrecord_job_invoiceable' });
                            var jobCat = job_record.getValue({ fieldId: 'custrecord_job_service_category' });
                            var packageStatus = job_record.getValue({ fieldId: 'custrecord_package_status' });
        
                            if (isNullorEmpty(jobInvoiceable)) {
                                if (!isNullorEmpty(packageStatus)) {
                                    if (packageStatus == 1 || isNullorEmpty(packageStatus)) {
                                        // Job Group Status is Null for Extras and Jobs Created in NS
                                        job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                    } else {
                                        job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                    }
                                } else {
                                    if (jobGroupStatus == 'Completed' || isNullorEmpty(jobGroupStatus)) {
                                        // Job Group Status is Null for Extras and Jobs Created in NS
                                        job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                    } else {
                                        job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 2 });
                                    }
                                }
                            }
                            job_record.setValue({ fieldId: 'custrecord_job_invoice', value: invoiceId });
                            job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                            job_record.setValue({ fieldId: 'custrecord_job_date_inv_finalised', value: getDate() });
                            job_record.setValue({ fieldId: 'custrecord_job_date_invoiced', value: getDate() });
                            job_record.setValue({ fieldId: 'custrecord_job_invoice_custom', value: 1 });
                        } else {
                            if (!isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_date_reviewed' })) && !isNullorEmpty(job_record.getValue({ fieldId: 'custrecord_job_date_inv_finalised' }))) {
                                job_record.setValue({ fieldId: 'custrecord_job_invoice', value: invoiceId });
                                job_record.setValue({ fieldId: 'custrecord_job_date_invoiced', value: getDate() });
                                job_record.setValue({ fieldId: 'custrecord_job_invoice_custom', value: 2 });
                            } else {
                                var body = 'Customer: ' + customer_internal_id + ' | Job: ' + job_id + 'cannot be updated because Date Review & Date Invoice Finalised is Empty.';
        
                                email.send({
                                    author: 112209,
                                    body: body,
                                    recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                                    subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot update Job',
                                });
        
                                //WS log:
                                log.error({
                                    title: 'Job #: ' + count_loop_job + ' | Job: ' + job_id + '.',
                                    details: 'ERROR: JOB X UPDATED - Inv & Date Invoice not empty.'
                                });
        
                                return false;
                            }
                        }
        
                        job_record.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        })
        
                        //WS Log:
                        log.debug({
                            title: 'Job #: ' + count_loop_job + ' | Job: ' + job_id + '.',
                            details: usage_loopstart_job - ctx.getRemainingUsage()
                        })
        
                    } else {
        
                        var body = 'Customer: ' + customer_internal_id + ' | Job: ' + job_id + 'cannot be updated because Invoice ID and Date Invoice is not Empty.';
        
                        email.send({
                            author: 409635,
                            body: body,
                            recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                            subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot update Job',
                        });
        
                        //WS log:
                        log.error({
                            title: 'Job #: ' + count_loop_job + ' | Job: ' + job_id + '.',
                            details: 'ERROR: JOB X UPDATED - Inv & Date Invoice not empty.'
                        });
        
                        return false;
                    }
                } catch (e) {
        
                    error_customers[error_customers.length] = customer_internal_id;
        
                    var message = '';
                    message += "Customer Internal ID: " + customer_internal_id + "</br>";
                    message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customer_internal_id + "'> View Customer </a></br>";
                    message += "----------------------------------------------------------------------------------</br>";
                    message += "Job: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=941&id=" + job_id + "'> View Job </a></br>";
                    message += "----------------------------------------------------------------------------------</br>";
                    message += e;
        
                    email.send({
                        author: 409635,
                        body: message,
                        recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                        subject: 'Invoice Creation - Customer: ' + customer_internal_id + ' cannot update Job',
                    })
                }
        
                return true;
            });
        
            //WS Log:
            log.debug({
                title: '--> END | update job function',
                details: ctx.getRemainingUsage()
            })

            if (reschedule != false) {
                return true;
            } else {
                return false;
            }
        
        }

        function getDate() {
            var date = new Date();
            date.setHours(date.getHours() + 17);
            date = format.format({ value: date, type: format.Type.DATE})
        
            return date;
        }

        function invoice_date() {

            var date = new Date();
        
            var month = date.getMonth(); //Months 0 - 11
            var day = date.getDate();
            var year = date.getFullYear();
        
            //If allocator run on the first day of the month, it takes the last month as the filter
            if (day == 1 || day == 2 || day == 3 || day == 4 || day == 5) {
                if (month == 0) {
                    month = 11;
                    year = year - 1
                } else {
                    month = month - 1;
                }
            }
        
            // var firstDay = new Date(year, (month), 1);
            var lastDay = new Date(year, (month + 1), 0);
        
            return format.format({ value: lastDay, type: format.Type.DATE})
        }

        function service_start_end_date(date_finalised) {

            var split_date = date_finalised.split('/');
        
            var date = new Date();
            var firstDay = new Date(date.getFullYear(), parseInt(split_date[1]) - 1, 1);
            var lastDay = new Date(date.getFullYear(), split_date[1], 0);
        
        
        
            var service_range = [];
        
            service_range[0] = format.format({ value: firstDay, type: format.Type.DATE})
            service_range[1] = format.format({ value: lastDay, type: format.Type.DATE})
        
            return service_range;
        
        }

        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }
        
        return {
            execute: invoiceCreation
        }
    }
);