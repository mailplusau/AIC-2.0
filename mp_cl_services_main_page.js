 /**
 * 
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * 
 * Description: Client script that habndles all the validations and calculations of the review page.  
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
        if (role == 1000) {
            //Franchisee
            zee = ctx.getCurrentUser();
        } else if (role == 3) { //Administrator
            zee = 6; //test
        } else if (role == 1032) { // System Support
            zee = 425904; //test-AR
        }

        var global_customer;
        var global_locked = null;
        var admin_fees_log = false;

        /**
         * On page initialisation- collapse the App Qty fields  and the Invoiceable Qty fields
         */
        function pageInit() {
            var currentScript = currentRecord.get();
            $(window).load(function() {
                // Animate loader off screen
                $(".se-pre-con").fadeOut("slow");;
            });

            $(document).ready(function() {
                $('[data-toggle="tooltip"]').tooltip();
            });

            $('.col_collapse_appqty').hide();
            $('.header_collapse').hide();
            $('.discount_collpase_appqty').hide();
            $('.singleline_collpase_appqty').hide();
            $('.total_collapse_appqty').hide();
            $('.monthlytotal_collapse_appqty').hide();
            $('.invoicetotalheader_collpase_appqty').hide();
            $('.invoiceable_qty_collpase').hide();
            $('.package_name_row').attr('colspan', 6);
            $('.header_invoiceable_qty_collpase').attr('colspan', 1);

            global_customer = currentScript.getValue({ fieldId: 'customer_id' });

            var start_date = GetFormattedDate(currentScript.getValue({ fieldId: 'start_date' }) );
            var end_date = GetFormattedDate(currentScript.getValue({ fieldId: 'end_date' }) );

            $('.start_date').val(start_date);
            $('.end_date').val(end_date);

            admin_fees_log = currentScript.getValue({ fieldId: 'admin_fees_log' });

            global_locked = currentScript.getValue({ fieldId: 'locked' });

            document.getElementById('tdbody_reviewed').style = 'background-color: #125ab2 !important;color: white;';


            if (global_locked == 'yes') {
                document.getElementById('tr_submitter').style.display = 'none';
                document.getElementById('tdbody_reviewed').style.display = 'none';
                $('.admin_fees_on').prop('disabled', true);
                $('.admin_fees_off').prop('disabled', true);
                $('.invoiceable_qty').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.admin_fees_rate').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.admin_fees_qty').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.job_description').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.single_job_description').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.add_services').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.fixed_discount_value').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.fixed_discount_qty').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.total_package_value').prop('disabled', function(i, v) {
                    return !v;
                });
                $('.customer_po').prop('disabled', function(i, v) {
                    return !v;
                });
            }

            var result = finalise_date(currentScript.getValue({ fieldId: 'start_date' }));

            $(document).on('click', '.instruction_button', function(e) {

                $('.table_start').css("padding-top", "300px");
                $('.instruction_button').hide();
            });
            
            $('#exampleModal').on('show.bs.modal', function(event) {
                var button = $(event).relatedTarget // Button that triggered the modal
                var recipient = button.data('whatever') // Extract info from data-* attributes
                    // If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
                    // Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
                var modal = $(this)
                modal.find('.modal-title').text('New message to ' + recipient)
                modal.find('.modal-body input').val(recipient)
            });
            
            $(document).ready(function() {
                $(".modal_display").click(function() {
                    var link = $(this).data("whatever");
                    // console.log(link);
                    $('.modal .modal-header').html('<div class="form-group"><h4><label class="control-label" for="inputError1">Information</label></h4></div>');
                    $('.modal .modal-body').html("");
                    $('.modal .modal-body').html(link);
                    $('.modal .modal-footer').html('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>');
                    $('.modal').modal("show");
            
            
                });
            });
            
            
            /**
             * [description] - On click of the '+', open up the App Qty fields
             */
            $(document).on('click', '.collapse_appqty', function(e) {
                $('.col_collapse_appqty').show();
                $('.header_collapse').show();
                $('.discount_collpase_appqty').show();
                $('.singleline_collpase_appqty').show();
                $('.total_collapse_appqty').show();
                $('.monthlytotal_collapse_appqty').show();
                $('.invoicetotalheader_collpase_appqty').show();
                $('.package_name_row').attr('colspan', 12);
                $('.admin_fees_collpase').attr('colspan', 5);
                // $('.collapse_appqty').removeClass('glyphicon-plus');
                // $('.collapse_appqty').addClass('glyphicon-minus');
                $('.collapse_appqty').addClass('invoiceableqty_collapse');
            });
            
            /**
             * [description] - On click of the '+' for the second time, show the invoiceable qty fields
             */
            $(document).on('click', '.invoiceableqty_collapse', function(e) {
                $('.invoiceable_qty_collpase').show();
                $('.invoiceableqty_collapse').hide();
                // $('.package_name_row').attr('colspan',11);
                $('.header_invoiceable_qty_collpase').attr('colspan', 3);
                $('.admin_fees_collpase').attr('colspan', 7);
            });
            
            /**
             * [description] - On click of the '-', collapse all the App Qty and Invoiceable Qty fields
             */
            $(document).on('click', '.collapse_all', function(e) {
                $('.col_collapse_appqty').hide();
                $('.collapse_appqty').show();
                $('.invoiceable_qty_collpase').show();
                $('.invoiceableqty_collapse').show();
                $('.header_collapse').hide();
                $('.discount_collpase_appqty').hide();
                $('.singleline_collpase_appqty').hide();
                $('.total_collapse_appqty').hide();
                $('.monthlytotal_collapse_appqty').hide();
                $('.invoicetotalheader_collpase_appqty').hide();
                $('.invoiceable_qty_collpase').hide();
                $('.package_name_row').attr('colspan', 6);
                $('.admin_fees_collpase').attr('colspan', 0);
                $('.header_invoiceable_qty_collpase').attr('colspan', 1);
                $('.collapse_appqty').removeClass('invoiceableqty_collapse');
            });
            
            //DO CALCULATIONS IF THE DISCUNT QTY IN THE DISCOUNT ROW IS CHANGED
            $(document).on('blur', '.discount_qty', function(e) {
                var discount_value = $(this).closest('tr').find('.discount_value').val();
                var discount_qty = $(this).val();
                var attr_fixed = $(this).attr('package-fixed');
                var attr_packageid = $(this).attr('data-packageid');
            
                var old_total_discount_value = $(this).closest('tr').find('.total_discount_value').val();
                var old_total_value = $(this).closest('tr').next('tr').find('.total_package_value').val();
                var package_value = $(this).closest('tr').next('tr').find('.package_value').val();
                var discount_type = $(this).closest('tr').find('.discount_type').val();
            
                var total_package = 0;
            
                var package_invoiceable_qty_elem = document.getElementsByClassName("package_invoiceable_qty");
                var package_netsuite_qty_elem = document.getElementsByClassName("package_netsuite_qty");
                var package_app_qty_elem = document.getElementsByClassName("package_app_qty");
                var service_total_value_elem = document.getElementsByClassName("service_total_value");
            
                var app_qty = [];
            
                for (var i = 0; i < package_app_qty_elem.length; ++i) {
                    app_qty.push(parseInt(package_app_qty_elem[i].value));
                }
            
                var max = Math.max.apply(null, app_qty);
                //CHECKING THE MAX QTY OF ALL THE APP QTY AND IF THE DISCOUNT QTY IS LESS THAN THE MAX APP QTY, THE DISCOUNT QTY IS CHANGED TO THE MAX APP QTY
                if (discount_qty < max) {
                    discount_qty = max;
                    $(this).val(max);
                }
            
                //ADJUST THE QTYS OF THE TOTAL INVOICEABLE QTY FOR ALL SERVICES FOR THAT PACKAGE
                for (var i = 0; i < package_invoiceable_qty_elem.length; ++i) {
                    if (package_invoiceable_qty_elem[i].getAttribute("data-packageid") == attr_packageid) {
                        var initial_changed_qty = package_invoiceable_qty_elem[i].value;
                        var initial_load_qty = package_invoiceable_qty_elem[i].getAttribute("data-oldqty");
                        var netsuite_qty = package_netsuite_qty_elem[i].value;
                        var app_qty = package_app_qty_elem[i].value;
                        var rate = package_invoiceable_qty_elem[i].getAttribute("data-rate");
            
                        var total_inv_qty = parseFloat(app_qty) + parseFloat(netsuite_qty);
            
                        if (discount_qty >= 0) {
                            if (discount_qty == 0) { //IF DISCOUNT QTY ENTERED IS 0 
                                if (app_qty > 0) {
                                    alert('Cannot reduce quantity below ' + app_qty);
                                    $(this).val(app_qty);
                                    return false;
                                } else {
                                    package_netsuite_qty_elem[i].setAttribute("value", discount_qty);
                                    discount_qty = parseFloat(discount_qty) + parseFloat(app_qty);
                                    package_invoiceable_qty_elem[i].setAttribute("value", discount_qty);
                                }
                            } else {
                                package_invoiceable_qty_elem[i].setAttribute("value", discount_qty);
                                if (total_inv_qty != discount_qty) {
                                    var new_netsuite_qty = parseFloat(discount_qty) - parseFloat(total_inv_qty);
                                    new_netsuite_qty = parseFloat(netsuite_qty) + new_netsuite_qty;
                                    package_netsuite_qty_elem[i].setAttribute("value", new_netsuite_qty);
                                }
                            }
            
                            // package_app_qty_elem[i].setAttribute("value", new_app_qty);
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(discount_qty));
                            service_total_value_elem[i].setAttribute("value", roundTwoDec(total_rate));
                            total_package += total_rate;
            
                        } else {
                            alert('Wrong Quantity entered');
                            return false;
                        }
                    }
                }
            
                $(this).closest('tr').next('tr').find('.package_value').val(total_package);
                //CALCULATIONS FOR THE PACKAGE DISCOUNT VALUE BASED ON THE DISCOUNT TYPE
                if (discount_type == 1) {
                    var total_discount_value = (parseFloat(discount_qty) * parseFloat(discount_value));
                    var new_total_value = parseFloat(total_package) - total_discount_value;
                } else {
                    var total_discount_value = ((parseFloat(discount_value) / 100) * parseFloat(total_package));
                    var new_total_value = parseFloat(total_package) - total_discount_value;
                }
            
                //UPDATE THE TOTAL DISCOUNT VALUE AND THE TOTAL PACKAGE VALUE
                $(this).closest('tr').find('.total_discount_value').val(roundTwoDec(total_discount_value));
                $(this).closest('tr').next('tr').next('tr').find('.total_package_value').val(roundTwoDec(new_total_value));
                $(this).closest('tr').next('tr').next('tr').find('.total_package_value').focus();
            
                //UPDATE THE INVOICE TOTAL BASED ON THE CHANGE
                updateTotal();
            });
            
            //ON CHANGE OF THE INVOICEABLE QTY FOR THE SERVICES AND EXTRAS SECTION
            $(document).on('blur', '.invoiceable_qty', function(e) {
            
                var invoiceable_qty = $(this).val();
                if (isNullorEmpty(invoiceable_qty)) {
                    invoiceable_qty = 0;
                    $(this).val(0);
                }
                var old_qty = $(this).attr('data-oldqty');
                var rate = $(this).attr('data-rate');
                var app_qty = $(this).closest('tr').find('.app_qty').val();
                var netsuite_qty = $(this).closest('tr').find('.package_netsuite_qty').val();
                var total_inv_qty = parseFloat(app_qty) + parseFloat(netsuite_qty);
            
                if (invoiceable_qty >= 0) {
                    if (invoiceable_qty == 0) {
                        if (app_qty > 0) {
                            alert('Cannot reduce quantity below ' + app_qty + '. \nTo reduce the quantity, please click on the App Jobs and set \"DO YOU WANT TO INVOICE JOB GROUP??\" to \"No\"');
                            $(this).val(app_qty);
                            $(this).closest('tr').find('.package_netsuite_qty').val(0);
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(app_qty));
                            $(this).closest('tr').find('.service_total_value').val(roundTwoDec(total_rate));
                            $(this).closest('tr').find('.service_total_value').focus();
                            $(this).closest('tr').find('.service_total').val((total_rate));
                            return false;
                        } else {
                            var new_netsuite_qty = parseFloat(invoiceable_qty);
                            $(this).closest('tr').find('.package_netsuite_qty').val(new_netsuite_qty);
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(invoiceable_qty));
                            $(this).closest('tr').find('.service_total_value').val(roundTwoDec(total_rate));
                            $(this).closest('tr').find('.service_total_value').focus();
                            $(this).closest('tr').find('.service_total').val((total_rate));
                        }
                    } else {
                        if (parseInt(app_qty) > invoiceable_qty) {
                            alert('Cannot reduce quantity below ' + app_qty + '. \nTo reduce the quantity, please click on the App Jobs and set \"DO YOU WANT TO INVOICE JOB GROUP??\" to \"No\"');
                            $(this).val(app_qty);
                            $(this).closest('tr').find('.package_netsuite_qty').val(0);
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(app_qty));
                            $(this).closest('tr').find('.service_total_value').val(roundTwoDec(total_rate));
                            $(this).closest('tr').find('.service_total_value').focus();
                            $(this).closest('tr').find('.service_total').val((total_rate));
                            return false;
                        }
                        if (parseInt(total_inv_qty) != invoiceable_qty) {
                            var new_netsuite_qty = parseFloat(invoiceable_qty) - parseFloat(total_inv_qty);
                            new_netsuite_qty = parseFloat(netsuite_qty) + new_netsuite_qty;
                            $(this).closest('tr').find('.package_netsuite_qty').val(new_netsuite_qty);
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(invoiceable_qty));
                            $(this).closest('tr').find('.service_total_value').val((total_rate).toFixed(2));
                            $(this).closest('tr').find('.service_total_value').focus();
                            $(this).closest('tr').find('.service_total').val((total_rate).toFixed(2));
                            // $(this).closest('tr').find('.service_total_value').val((total_rate));
                        }
                    }
            
            
                } else {
                    alert('Cannot reduce quantity below ' + app_qty + '. \nTo reduce the quantity, please click on the App Jobs and set \"DO YOU WANT TO INVOICE JOB GROUP??\" to \"No\"');
                    $(this).val(app_qty);
                    return false;
                }
            
                updateTotal();
            });

            $(document).on('blur', '.total_package_value', function(e) {
                var total_value = $(this).val();
                // var old_total_discount_value = $(this).closest('tr').find('.total_discount_value').val();
                var package_value = $(this).closest('tr').find('.package_value').val();
                // var discount_type = $(this).closest('tr').find('.discount_type').val();
                var discount_qty = $(this).closest('tr').prev('tr').prev('tr').find('.discount_qty').val();
            
                var total_discount = parseFloat(total_value) - parseFloat(package_value);
            
                var per_discount = total_discount / parseFloat(discount_qty);
            
                $(this).closest('tr').prev('tr').prev('tr').find('.discount_value').val(roundTwoDec(parseFloat(per_discount)));
                $(this).closest('tr').prev('tr').prev('tr').find('.total_discount_value').val(roundTwoDec(parseFloat(total_discount)));
            
            });
            
            //ON CHANGE OF THE FIXED RATE QTY
            $(document).on('blur', '.fixed_discount_qty', function(e) {
                var discount_value = $(this).closest('tr').find('.fixed_discount_value').val();
                var discount_qty = $(this).val();
                var attr_fixed = $(this).attr('package-fixed');
                var attr_packageid = $(this).attr('data-packageid');
            
                var old_total_discount_value = $(this).closest('tr').find('.total_discount_value').val();
                var old_total_value = $(this).closest('tr').next('tr').find('.total_package_value').val();
                var package_value = $(this).closest('tr').next('tr').find('.package_value').val();
                var discount_type = $(this).closest('tr').find('.discount_type').val();
            
                var total_package = 0;
            
                var package_invoiceable_qty_elem = document.getElementsByClassName("package_invoiceable_qty");
                var package_netsuite_qty_elem = document.getElementsByClassName("package_netsuite_qty");
                var package_app_qty_elem = document.getElementsByClassName("package_app_qty");
                var service_total_value_elem = document.getElementsByClassName("service_total_value");
            
                var app_qty = [];
            
                for (var i = 0; i < package_app_qty_elem.length; ++i) {
                    var packageID = package_invoiceable_qty_elem[i].getAttribute("data-packageid");
                    if (attr_packageid == packageID) {
                        app_qty.push(parseInt(package_app_qty_elem[i].value));
                    }
                }
                // console.log(app_qty);
                // return false;
            
                var max = Math.max.apply(null, app_qty);
                if (discount_qty < max) {
                    discount_qty = max;
                    $(this).val(max);
                }
            
                for (var i = 0; i < package_invoiceable_qty_elem.length; ++i) {
                    if (package_invoiceable_qty_elem[i].getAttribute("data-packageid") == attr_packageid) {
                        var initial_changed_qty = package_invoiceable_qty_elem[i].value;
                        var initial_load_qty = package_invoiceable_qty_elem[i].getAttribute("data-oldqty");
                        var netsuite_qty = package_netsuite_qty_elem[i].value;
                        var app_qty = package_app_qty_elem[i].value;
                        var rate = package_invoiceable_qty_elem[i].getAttribute("data-rate");
                        var service_cat = package_netsuite_qty_elem[i].getAttribute("data-servicecat");
            
                        var total_inv_qty = parseFloat(app_qty) + parseFloat(netsuite_qty);
            
                        if (service_cat == 1) {
                            if (discount_qty >= 0) {
                                if (discount_qty == 0) {
                                    if (app_qty > 0) {
                                        alert('Cannot reduce quantity below ' + app_qty);
                                        $(this).val(app_qty);
                                        return false;
                                    } else {
                                        package_netsuite_qty_elem[i].setAttribute("value", discount_qty);
                                        discount_qty = parseFloat(discount_qty) + parseFloat(app_qty);
                                        package_invoiceable_qty_elem[i].setAttribute("value", discount_qty);
                                    }
            
                                } else {
                                    package_invoiceable_qty_elem[i].setAttribute("value", discount_qty);
                                    if (total_inv_qty != discount_qty) {
                                        var new_netsuite_qty = parseFloat(discount_qty) - parseFloat(total_inv_qty);
                                        new_netsuite_qty = parseFloat(netsuite_qty) + new_netsuite_qty;
                                        package_netsuite_qty_elem[i].setAttribute("value", new_netsuite_qty);
                                    }
                                }
            
                                // package_app_qty_elem[i].setAttribute("value", new_app_qty);
                                var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(discount_qty));
                                service_total_value_elem[i].setAttribute("value", total_rate);
                                total_package += total_rate;
            
                            } else {
                                alert('Wrong Quantity entered');
                                return false;
                            }
                        } else {
                            var total_rate = updateServiceAmount(parseFloat(rate), parseFloat(initial_changed_qty));
                            total_package += total_rate;
                        }
            
                    }
                }
            
                $(this).closest('tr').find('.package_value').val(total_package);
                var package_value = parseFloat(total_package);
                var total_discount_value = (parseFloat(discount_qty) * parseFloat(discount_value));
                $(this).closest('tr').find('.total_package_value').val(roundTwoDec(total_discount_value));
                $(this).closest('tr').find('.total_package_value').focus();
            
                var new_discount = parseFloat(total_discount_value) - parseFloat(package_value);
            
                if (new_discount < 0) {
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').addClass('has-error');
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').removeClass('has-success');
                } else {
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').addClass('has-success');
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').removeClass('has-error');
                }
            
                $(this).closest('tr').prev('tr').find('.total_discount_value').val(roundTwoDec(new_discount));
            
                var discount_rate = new_discount / parseFloat(discount_qty);
            
                $(this).closest('tr').prev('tr').prev('tr').find('.total_discount_value').val(roundTwoDec(new_discount));
            
            
            
                $(this).closest('tr').prev('tr').prev('tr').find('.discount_value').val(roundTwoDec((new_discount / parseFloat(discount_qty))));
                $(this).closest('tr').prev('tr').prev('tr').find('.discount_qty').val(discount_qty);
            
                updateTotal();
            });
            
            //GET THE OLD VALUE OF THE DISCOUNT VALUE.
            $(document).on('focusin', '.discount_value', function() {
                $(this).data('oldval', $(this).val());
            });
            
            //ON CHANGE OF THE DISCOUNT VALUE
            $(document).on('blur', '.discount_value', function(e) {
                var discount_qty = $(this).closest('tr').find('.discount_qty').val();
                var discount_value = $(this).val();
                var old_discount_value = $(this).data('oldval');
                var attr_fixed = $(this).attr('package-fixed');
                var attr_packageid = $(this).attr('data-packageid');
            
                var old_total_discount_value = $(this).closest('tr').find('.total_discount_value').val();
                var old_total_value = $(this).closest('tr').next('tr').next('tr').find('.total_package_value').val();
                var package_value = $(this).closest('tr').next('tr').next('tr').find('.package_value').val();
                var discount_type = $(this).closest('tr').find('.discount_type').val();
            
                //IF THE DISCOUNT TYPE IS $
                if (discount_type == 1) {
                    var total_discount_value = (parseFloat(discount_qty) * parseFloat(discount_value));
                    //TO CHECK THE TOTAL DISCOUNT VALUE IS NOT GREATER THAN THE TOTAL PACKAGE OF ALL THE SERVICES
                    if (total_discount_value < package_value) {
                        $(this).closest('tr').find('.total_discount_value').val(roundTwoDec(total_discount_value));
                    } else {
                        alert('Total value is greater than the total of the package');
                        $(this).val(old_discount_value);
                        var total_discount_value = (parseFloat(discount_qty) * parseFloat(old_discount_value));
                        $(this).closest('tr').find('.total_package_value').val(roundTwoDec(total_discount_value));
                        $(this).closest('tr').find('.total_package_value').focus();
                        return false;
                    }
                    var new_total_value = parseFloat(package_value) - total_discount_value;
                } else { //IF DISCOUNT TYPE IS %
                    var total_discount_value = ((parseFloat(discount_value) / 100) * parseFloat(package_value));
                    if (total_discount_value < package_value) {
                        $(this).closest('tr').find('.total_discount_value').val(roundTwoDec(total_discount_value));
                    } else {
                        alert('Total value is greater than the total of the package');
                        $(this).val(old_discount_value);
                        var total_discount_value = (parseFloat(discount_qty) * parseFloat(old_discount_value));
                        $(this).closest('tr').find('.total_discount_value').val(roundTwoDec(total_discount_value));
                        return false;
                    }
                    var new_total_value = parseFloat(package_value) - total_discount_value;
                }
                // $(this).closest('tr').find('.total_discount_value').val(-(total_discount_value));
                $(this).closest('tr').next('tr').next('tr').find('.total_package_value').val(roundTwoDec(new_total_value));
                $(this).closest('tr').next('tr').next('tr').find('.total_package_value').focus();
            
                updateTotal();
            });
            
            //GET THE OLD FIXED RATE
            $(document).on('focusin', '.fixed_discount_value', function() {
                $(this).data('oldval', $(this).val());
            });
            
            //ON CHANGE OF THE FIXED RATE VALUE
            $(document).on('blur', '.fixed_discount_value', function(e) {
                var discount_qty = $(this).closest('tr').find('.fixed_discount_qty').val();
                var discount_value = $(this).val();
                var old_discount_value = $(this).data('oldval');
                var attr_fixed = $(this).attr('package-fixed');
                var attr_packageid = $(this).attr('data-packageid');
            
                var old_total_discount_value = $(this).closest('tr').find('.total_discount_value').val();
                var old_total_value = $(this).closest('tr').next('tr').find('.total_package_value').val();
                var package_value = $(this).closest('tr').next('tr').find('.package_value').val();
                var discount_type = $(this).closest('tr').find('.discount_type').val();
            
                var package_value = $(this).closest('tr').find('.package_value').val();
                var total_discount_value = (parseFloat(discount_qty) * parseFloat(discount_value));
                if (total_discount_value < package_value) {
                    $(this).closest('tr').find('.total_package_value').val(roundTwoDec(total_discount_value));
                    $(this).closest('tr').find('.total_package_value').focus();
                } else {
                    alert('Total value is greater than the total of the package');
                    $(this).val(old_discount_value);
                    var total_discount_value = (parseFloat(discount_qty) * parseFloat(old_discount_value));
                    $(this).closest('tr').find('.total_package_value').val(roundTwoDec(total_discount_value));
                    $(this).closest('tr').find('.total_package_value').focus();
                    return false;
                }
            
                var new_discount = parseFloat(total_discount_value) - parseFloat(package_value);
            
                if (new_discount < 0) {
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').addClass('has-error');
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').removeClass('has-success');
                } else {
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').addClass('has-success');
                    $(this).closest('tr').prev('tr').prev('tr').find('.discount_dollar').removeClass('has-error');
                }
            
                $(this).closest('tr').prev('tr').prev('tr').find('.total_discount_value').val(roundTwoDec(new_discount));
            
                $(this).closest('tr').prev('tr').prev('tr').find('.discount_value').val(roundTwoDec(new_discount / parseFloat(discount_qty)));
                $(this).closest('tr').prev('tr').prev('tr').find('.discount_qty').val(roundTwoDec(discount_qty));
            
                updateTotal();
            });
            
            //ON CHANGE OF THE DISCOUNT TYPE, HIDE OR SHOW THE DISCOUNT QTY
            $(document).on("change", ".discount_type", function(e) {
            
                var discount_type = $(this).val();
                //IF THE DISCOUNT TYPE IS $, SHOW THE DISCOUNT QTY
                if (discount_type == 1) {
                    $(this).closest('tr').find('.discount_qty').show();
                } else {
                    $(this).closest('tr').find('.discount_qty').hide();
                }
            
            });
            
            //ON CHANGE OF THE INVOICE SINGLE LINE 
            $(document).on("change", ".invoice_single_line", function(e) {
            
                var packageid;
                $('option:selected', this).each(function() {
                    packageid = ($(this).data('packageid'));
                });
                var value = $(this).val();
            
                var package_invoiceable_qty_elem = document.getElementsByClassName("package_invoiceable_qty");
                var job_desciption_elem = document.getElementsByClassName("job_description");
            
                for (var i = 0; i < package_invoiceable_qty_elem.length; ++i) {
                    if (job_desciption_elem[i].getAttribute("data-packageid") == packageid) {
                        //IF INVOICE SINGLE LINE IS SET TO YES, HIDE THE INVOICE DETAILS FIELDS FOR EACH OF THE SERVICES PRESENT IN THE PACKAGE
                        if (value == 1) {
                            $(this).closest('tr').find('.single_job_description').show();
                            job_desciption_elem[i].setAttribute('style', "display: none");
                            job_desciption_elem[i].setAttribute('value', "");
                            job_desciption_elem[i].setAttribute('data-singleline', "1");
                        } else {
                            //HIDE THE INVOICE DETAIL SHOWN IN THE INVOICE DETAIL ROW AND SHOW THE INVOICE DETAIL FIELDS FOR EACH OF THE SERVICES PRESENT IN THE PACKAGE
                            $(this).closest('tr').find('.single_job_description').hide();
                            $(this).closest('tr').find('.single_job_description').val(null);
                            job_desciption_elem[i].setAttribute('style', "display: display");
                            job_desciption_elem[i].setAttribute('data-singleline', "2");
                        }
                    }
                }
                if (value == 1) {
                    $(this).closest('tr').find('.single_line_hidden').val("1");
                } else {
                    $(this).closest('tr').find('.single_line_hidden').val("2");
                }
            
            
            });

            /**
             * [description] - To show the Invoice Preview modal
             */
            $(document).on('click', '.preview_row', function(event) {
                var currentScript = currentRecord.get();

                var discount_type_elem = document.getElementsByClassName("discount_type");
                var discount_value_elem = document.getElementsByClassName("discount_value");
                var discount_qty_elem = document.getElementsByClassName("discount_qty");
                var total_discount_elem = document.getElementsByClassName("total_discount_value");
                var invoice_single_line_elem = document.getElementsByClassName("invoice_single_line");
                var total_package_value = document.getElementsByClassName("total_package_value");
                var single_line_hidden = document.getElementsByClassName("single_line_hidden");
                var fixed_discount_value = document.getElementsByClassName("fixed_discount_value");
                var job_description_elem = document.getElementsByClassName("job_description");
                var single_job_description_elem = document.getElementsByClassName("single_job_description");
                var admin_fees_rate_elem = document.getElementsByClassName("admin_fees_rate");
                var admin_fees_qty_elem = document.getElementsByClassName("admin_fees_qty");

                var gst_value = 0.1;
                var total_gst = 1.1;

                var sum_total = 0.0;
                var sum_gst = 0.0;
                var sum_gross_total = 0.0;

                var package_details = [];
                var invoice_line_items = [];
                var invoice_line_qty = [];
                var invoice_line_rate = [];
                var invoice_line_gst = [];

                preview_html = '<table class="table table-responsive table-striped"><thead><tr class="info"><th><b>ITEM</b></th><th><b>DETAILS</b></th><th style="text-align: right;"><b>QTY</b></th><th style="text-align: right;"><b>RATE</b></th><th style="text-align: right;"><b>TOTAL</b></th><th style="text-align: right;"><b>GST</b></th><th style="text-align: right;"><b>GROSS TOTAL</b></th></thead><tbody>';

                if (!isNullorEmpty(total_discount_elem)) {
                    for (var i = 0; i < total_discount_elem.length; ++i) {
                        var job_id = total_discount_elem[i].getAttribute('data-netsuitejob');
                        var default_description_value = single_job_description_elem[i].getAttribute('default-value');
                        var description_value = single_job_description_elem[i].value;
                        var default_total_discount_value = total_discount_elem[i].getAttribute('default-value');
                        var single_line_hidden_default = single_line_hidden[i].getAttribute('default-singleline');
                        var total_discount_value = total_discount_elem[i].value;
                        var single_line_hidden_value = single_line_hidden[i].value;

                        if (isNullorEmpty(single_line_hidden_value)) {
                            single_line_hidden_value = single_line_hidden_default;
                        }

                        var package_id = null;
                        var discount_period = null;

                        if (total_discount_elem[i].hasAttribute("data-package")) {
                            package_id = total_discount_elem[i].getAttribute('data-package');
                            package_record = record.load({
                                type: 'customrecord_service_package',
                                id: package_id,
                            });
                            discount_period = package_record.getValue({ fieldId: 'custrecord_service_package_disc_period' });
                            package_ns_item_id = package_record.getValue({ fieldId: 'custrecord_service_package_ns_item' });

                            if (isNullorEmpty(package_ns_item_id)) {
                                package_ns_item = 'Fixed Charges';
                                package_ns_item_id = 66;
                            } else {
                                package_ns_item = search.lookupFields({
                                    type: 'item',
                                    id: package_ns_item_id,
                                    columns: 'itemid'
                                });

                            }

                            package_details[package_id] = [];

                            if (discount_period == 3) {
                                invoice_line_items[invoice_line_items.length] = package_ns_item_id;
                                invoice_line_qty[invoice_line_qty.length] = 1;
                                invoice_line_rate[invoice_line_rate.length] = total_package_value[i].value;
                                invoice_line_gst[invoice_line_gst.length] = 7;
                                package_details[package_id][0] = "1";
                                package_details[package_id][1] = "1";
                                package_details[package_id][2] = total_package_value[i].value;
                                preview_html += '<tr><td>' + package_ns_item + '</td><td>' + description_value + '</td><td style="text-align: right;">1</td><td style="text-align: right;">$' + parseFloat(total_package_value[i].value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(total_package_value[i].value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(total_package_value[i].value * gst_value).toFixed(2) + '</td style="text-align: right;"><td style="text-align: right;">$' + parseFloat(total_package_value[i].value * total_gst).toFixed(2) + '</td></tr>';

                                sum_total = parseFloat(sum_total + (total_package_value[i].value));
                                sum_gst = parseFloat(sum_gst + (total_package_value[i].value * gst_value));
                                sum_gross_total = parseFloat(sum_gross_total + (total_package_value[i].value * total_gst));
                            } else {

                                if (single_line_hidden_value == 1) {
                                    invoice_line_items[invoice_line_items.length] = package_ns_item_id;
                                    invoice_line_qty[invoice_line_qty.length] = discount_qty_elem[i].value;
                                    invoice_line_rate[invoice_line_rate.length] = fixed_discount_value[i].value;
                                    invoice_line_gst[invoice_line_gst.length] = 7;
                                    package_details[package_id][0] = "1";
                                    package_details[package_id][1] = discount_qty_elem[i].value;
                                    package_details[package_id][2] = fixed_discount_value[i].value;
                                    preview_html += '<tr><td>' + package_ns_item + '</td><td>' + description_value + '</td><td style="text-align: right;">' + discount_qty_elem[i].value + '</td><td style="text-align: right;">$' + parseFloat(fixed_discount_value[i].value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(fixed_discount_value[i].value * discount_qty_elem[i].value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(discount_qty_elem[i].value * fixed_discount_value[i].value * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(discount_qty_elem[i].value * fixed_discount_value[i].value * total_gst).toFixed(2) + '</td></tr>';

                                    sum_total = parseFloat(sum_total + (fixed_discount_value[i].value * discount_qty_elem[i].value));
                                    sum_gst = parseFloat(sum_gst + (discount_qty_elem[i].value * fixed_discount_value[i].value * gst_value));
                                    sum_gross_total = parseFloat(sum_gross_total + (discount_qty_elem[i].value * fixed_discount_value[i].value * total_gst));
                                } else {
                                    package_details[package_id][0] = "2";
                                    package_details[package_id][1] = discount_qty_elem[i].value;
                                    package_details[package_id][2] = discount_value_elem[i].value;
                                }
                            }
                        }
                    }
                }

                var package_invoiceable_qty_elem = document.getElementsByClassName("package_invoiceable_qty");

                var old_package_id = null;

                for (var i = 0; i < package_invoiceable_qty_elem.length; ++i) {

                    var qty = package_invoiceable_qty_elem[i].value;
                    var rate = package_invoiceable_qty_elem[i].getAttribute("data-rate");
                    var item_name = package_invoiceable_qty_elem[i].getAttribute("data-nsitem");
                    var item_id = package_invoiceable_qty_elem[i].getAttribute("data-nsitemid");
                    var gst = package_invoiceable_qty_elem[i].getAttribute("data-gst");

                    // console.log(item_name);

                    if (package_invoiceable_qty_elem[i].hasAttribute("data-packageid")) {
                        var package_id = package_invoiceable_qty_elem[i].getAttribute("data-packageid");

                        if ((old_package_id == package_id && isNullorEmpty(old_package_id)) || old_package_id == package_id) {

                            if (package_details[old_package_id] != undefined) {

                                if (package_details[old_package_id][0] != "1") {

                                    // console.log('first if inside 2');
                                    if (gst == 'Yes' || gst == '- None -') {
                                        invoice_line_items[invoice_line_items.length] = item_id;
                                        invoice_line_qty[invoice_line_qty.length] = qty;
                                        invoice_line_rate[invoice_line_rate.length] = rate;
                                        invoice_line_gst[invoice_line_gst.length] = 7;
                                        preview_html += '<tr><td>' + item_name + '</td><td>' + job_description_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * total_gst).toFixed(2) + '</td></tr>';

                                        sum_total = parseFloat(sum_total + (qty * rate));
                                        sum_gst = parseFloat(sum_gst + (qty * rate * gst_value));
                                        sum_gross_total = parseFloat(sum_gross_total + (qty * rate * total_gst));
                                    } else {
                                        invoice_line_items[invoice_line_items.length] = item_id;
                                        invoice_line_qty[invoice_line_qty.length] = qty;
                                        invoice_line_rate[invoice_line_rate.length] = rate;
                                        invoice_line_gst[invoice_line_gst.length] = 9;
                                        preview_html += '<tr><td>' + item_name + '</td><td>' + job_description_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;"></td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td></tr>';
                                        sum_total = parseFloat(sum_total + (qty * rate));
                                        sum_gross_total = parseFloat(sum_gross_total + (qty * rate));
                                    }

                                }

                            }
                        } else {

                            if (package_details[old_package_id] != undefined) {

                                if (package_details[old_package_id][0] != "1") {

                                    var font_color = '';

                                    if (package_details[old_package_id][2] < 0) {
                                        font_color = 'color:red;';
                                    }
                                    invoice_line_items[invoice_line_items.length] = 97;
                                    invoice_line_qty[invoice_line_qty.length] = package_details[old_package_id][1];
                                    invoice_line_rate[invoice_line_rate.length] = package_details[old_package_id][2];
                                    invoice_line_gst[invoice_line_gst.length] = 7;
                                    preview_html += '<tr style="' + font_color + '"><td>Discount</td><td></td><td style="text-align: right;">' + package_details[old_package_id][1] + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][2]).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2]).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2] * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2] * total_gst).toFixed(2) + '</td></tr>';

                                    sum_total = parseFloat(sum_total + (package_details[old_package_id][1] * package_details[old_package_id][2]));
                                    sum_gst = parseFloat(sum_gst + (package_details[old_package_id][1] * package_details[old_package_id][2] * gst_value));
                                    sum_gross_total = parseFloat(sum_gross_total + (package_details[old_package_id][1] * package_details[old_package_id][2] * total_gst));
                                }

                                if (package_details[package_id][0] != "1") {
                                    // console.log('second if inside 3');
                                    if (gst == 'Yes' || gst == '- None -') {
                                        invoice_line_items[invoice_line_items.length] = item_id;
                                        invoice_line_qty[invoice_line_qty.length] = qty;
                                        invoice_line_rate[invoice_line_rate.length] = rate;
                                        invoice_line_gst[invoice_line_gst.length] = 7;
                                        preview_html += '<tr><td>' + item_name + '</td><td>' + job_description_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * total_gst).toFixed(2) + '</td></tr>';
                                        sum_total = parseFloat(sum_total + (qty * rate));
                                        sum_gst = parseFloat(sum_gst + (qty * rate * gst_value));
                                        sum_gross_total = parseFloat(sum_gross_total + (qty * rate * total_gst));
                                    } else {
                                        invoice_line_items[invoice_line_items.length] = item_id;
                                        invoice_line_qty[invoice_line_qty.length] = qty;
                                        invoice_line_rate[invoice_line_rate.length] = rate;
                                        invoice_line_gst[invoice_line_gst.length] = 9;
                                        preview_html += '<tr><td>' + item_name + '</td><td>' + job_description_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;"></td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td></tr>';
                                        sum_total = parseFloat(sum_total + (qty * rate));
                                        sum_gross_total = parseFloat(sum_gross_total + (qty * rate));
                                    }
                                }
                            }
                        }
                        old_package_id = package_invoiceable_qty_elem[i].getAttribute("data-packageid");
                    }

                }


                if (!isNullorEmpty(old_package_id)) {

                    if (package_details[old_package_id] != undefined) {

                        if (package_details[old_package_id][0] != "1") {

                            var font_color = '';

                            if (package_details[old_package_id][2] < 0) {
                                font_color = 'color:red;';
                            }
                            invoice_line_items[invoice_line_items.length] = 97;
                            invoice_line_qty[invoice_line_qty.length] = package_details[old_package_id][1];
                            invoice_line_rate[invoice_line_rate.length] = package_details[old_package_id][2];
                            invoice_line_gst[invoice_line_gst.length] = 7;
                            preview_html += '<tr style="' + font_color + '"><td>Discount</td><td></td><td style="text-align: right;">' + package_details[old_package_id][1] + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][2]).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2]).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2] * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(package_details[old_package_id][1] * package_details[old_package_id][2] * total_gst).toFixed(2) + '</td></tr>';

                            sum_total = parseFloat(sum_total + (package_details[old_package_id][1] * package_details[old_package_id][2]));
                            sum_gst = parseFloat(sum_gst + (package_details[old_package_id][1] * package_details[old_package_id][2] * gst_value));
                            sum_gross_total = parseFloat(sum_gross_total + (package_details[old_package_id][1] * package_details[old_package_id][2] * total_gst));

                        }

                    }

                }

                var invoiceable_qty_elem = document.getElementsByClassName("invoiceable_qty");
                var job_description_preview_elem = document.getElementsByClassName("job_description_preview");

                for (var i = 0; i < invoiceable_qty_elem.length; ++i) {
                    // var service_id = invoiceable_qty_elem[i].getAttribute("data-serviceid");
                    // var service_record = record.load({ type: 'customrecord_service', id: service_id });
                    // var item_id = service_record.getValue({ fieldId: 'custrecord_service_ns_item' });
                    // var item_name =  search.lookupFields({ type: 'item', id: item_id, columns: 'itemid') };
                    var qty = invoiceable_qty_elem[i].value;
                    var rate = invoiceable_qty_elem[i].getAttribute("data-rate");
                    var item_name = invoiceable_qty_elem[i].getAttribute("data-nsitem");
                    var item_id = invoiceable_qty_elem[i].getAttribute("data-nsitemid");
                    var gst = invoiceable_qty_elem[i].getAttribute("data-gst");

                    if (qty != 0) {

                        var font_color = '';

                        if (item_id == 97) {
                            font_color = 'color:red;';
                        }

                        if (gst == 'Yes' || gst == '- None -') {
                            invoice_line_items[invoice_line_items.length] = item_id;
                            invoice_line_qty[invoice_line_qty.length] = qty;
                            invoice_line_rate[invoice_line_rate.length] = rate;
                            invoice_line_gst[invoice_line_gst.length] = 7;
                            preview_html += '<tr style="' + font_color + '"><td>' + item_name + '</td><td>' + job_description_preview_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * total_gst).toFixed(2) + '</td></tr>';

                            sum_total = parseFloat(sum_total + (qty * rate));
                            sum_gst = parseFloat(sum_gst + (qty * rate * gst_value));
                            sum_gross_total = parseFloat(sum_gross_total + (qty * rate * total_gst));
                        } else {
                            invoice_line_items[invoice_line_items.length] = item_id;
                            invoice_line_qty[invoice_line_qty.length] = qty;
                            invoice_line_rate[invoice_line_rate.length] = rate;
                            invoice_line_gst[invoice_line_gst.length] = 9;
                            preview_html += '<tr><td>' + item_name + '</td><td>' + job_description_preview_elem[i].value + '</td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;"></td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td></tr>';

                            sum_total = parseFloat(sum_total + (qty * rate));
                            sum_gross_total = parseFloat(sum_gross_total + (qty * rate));
                        }
                    }


                }

                if (admin_fees_log == true || admin_fees_log == 'true') {
                    if (!isNullorEmpty(admin_fees_rate_elem)) {
                        for (var i = 0; i < admin_fees_rate_elem.length; i++) {
                            var rate = admin_fees_rate_elem[i].value;
                            var qty = admin_fees_qty_elem[i].value;

                            if (rate > 0 && qty > 0) {
                                invoice_line_items[invoice_line_items.length] = 8729;
                                invoice_line_qty[invoice_line_qty.length] = qty;
                                invoice_line_rate[invoice_line_rate.length] = rate;
                                invoice_line_gst[invoice_line_gst.length] = 7;
                                preview_html += '<tr><td>Account Admin Fee</td><td></td><td style="text-align: right;">' + qty + '</td><td style="text-align: right;">$' + parseFloat(rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * gst_value).toFixed(2) + '</td><td style="text-align: right;">$' + parseFloat(qty * rate * total_gst).toFixed(2) + '</td></tr>';
                                sum_total = parseFloat(sum_total + (qty * rate));
                                sum_gst = parseFloat(sum_gst + (qty * rate * gst_value));
                                sum_gross_total = parseFloat(sum_gross_total + (qty * rate * total_gst));
                            }

                        }
                    }
                }

                var searchedJobsExtras = search.load({
                    id: 'customsearch_job_invoicing_summary',
                    type: 'customrecord_job'
                });

                searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_operator_franchisee',
                    operator: search.Operator.ANYOF,
                    values: zee,
                }));


                searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_inv_finalised', operator: search.Operator.ISEMPTY }));
                if (!isNullorEmpty(currentScript.getValue({ fieldId: 'start_date' })) && !isNullorEmpty(currentScript.getValue({ fieldId: 'end_date' }))) {
                    searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', operator: search.Operator.ONORAFTER, values: currentScript.getValue({ fieldId: 'start_date' }) }));
                    searchedJobsExtras.filters.push(search.createFilter({ name: 'custrecord_job_date_scheduled', operator: search.Operator.ONORBEFORE, values: currentScript.getValue({ fieldId: 'end_date' }) }));
                }


                var resultSetExtras = searchedJobsExtras.run();

                var next_customer = null;

                var result = resultSetExtras.getRange({
                    start: 0,
                    end: 1
                })

                if (!isNullorEmpty(result) && result.length != 0) {
                    next_customer = result[0].getValue({ name: 'internalid', join: 'CUSTRECORD_JOB_CUSTOMER', summary: search.Summary.GROUP });
                }

                preview_html += '<tr class="success" style="font-weight: bold;font-size: small;"><td>TOTAL</td><td></td><td></td><td></td><td style="text-align: right;">$' + parseFloat($('.total_value').val()).toFixed(2) + '</td><td style="text-align: right;">$' + sum_gst.toFixed(2) + '</td><td style="text-align: right;">$' + sum_gross_total.toFixed(2) + '</td></tr></tbody></table>';

                var footer_html = '';

                var result = finalise_date(currentScript.getValue({ fieldId: 'start_date' }));

                if ((global_locked == 'yes' || result == false) && role == 1000 && zee != 6 && zee != 425904) {
                    footer_html = '<span class="col-sm-10"><b>"Create Custom Invoice"</b> functionality will only be available on or after the last day of the month</span><button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
                } else {
                    footer_html = '<a href="https://1048144.app.netsuite.com/app/accounting/transactions/custinvc.nl?compid=1048144&cf=116&entity=' + global_customer + '&itemids=' + invoice_line_items.toString() + '&qty=' + invoice_line_qty.toString() + '&rate=' + invoice_line_rate.toString() + '&gst=' + invoice_line_gst.toString() + '&next_customer=' + next_customer + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '" class="btn btn-primary" value="">Create Custom Invoice</a><button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
                }

                $('.modal .modal-header').html('<div class="form-group"><h4><label class="control-label" for="inputError1">Invoice Preview</label></h4></div>');
                $('.modal .modal-footer').html(footer_html);
                $('.modal .modal-body').html("");
                $('.modal .modal-body').html(preview_html);
                $('.modal').modal("show");
            });

            /**
            * [description] - To update the Admin Fees Total when the rate is changed
            */
            $(document).on('blur', '.admin_fees_rate', function(e) {
                var admin_fees = $(this).val();
                var serviceid = $(this).attr('data-serviceid');
                var jobid = $(this).attr('data-jobid');
                var old_admin_fees = $(this).attr('data-oldvalue');

                if (admin_fees != old_admin_fees) {
                    if (!isNullorEmpty(serviceid)) {

                        deleted_service_ids[deleted_service_ids.length] = serviceid;

                        $(this).attr('data-serviceid', null);

                        if (!isNullorEmpty(jobid)) {
                            deleted_job_ids[deleted_job_ids.length] = jobid;
                            $(this).attr('data-jobid', null);
                        }
                    }

                    var admin_fees_qty = $(this).closest('tr').find('.admin_fees_qty').val();

                    var admin_fees_total = (parseFloat(admin_fees) * parseFloat(admin_fees_qty));

                    $(this).closest('tr').find('.admin_fees_total').val(admin_fees_total);

                    updateTotal();
                }


            });

            /**
            * [description] - To update the Admin Fees Total when the qty is changed
            */
            $(document).on('blur', '.admin_fees_qty', function(e) {
                var admin_fees_qty = $(this).val();
                var admin_fees = $(this).closest('tr').find('.admin_fees_rate').val();

                var admin_fees_total = (parseFloat(admin_fees) * parseFloat(admin_fees_qty));

                $(this).closest('tr').find('.admin_fees_total').val(admin_fees_total);

                updateTotal();

            });

            /**
            * [description] - Css and toggle between the On/Off Button for Admin Fee
            */
            $('.btn-toggle').click(function() {

                // alert(currentScript.getValue({ fieldId: 'admin_fees_not_applicable' }));
                if (global_locked != 'yes' && currentScript.getValue({ fieldId: 'admin_fees_not_applicable' }) != '1') {
                    $(this).find('.btn').toggleClass('active');

                    if ($(this).find('.btn-success').size() > 0) {
                        $(this).find('.btn').toggleClass('btn-success');
                    }

                    $(this).find('.btn').toggleClass('btn-default');
                }


                return false;
            });


            /**
            * [description] - To show the Admin Fee Row
            */
            $('.admin_fees_on').click(function() {
                $('.admin_fees_row').show();
                $('.no_extras_class').hide();

                var jobid = $('.admin_fees_rate').attr('data-jobid');
                var serviceid = $('.admin_fees_rate').attr('data-serviceid');

                if (isNullorEmpty(jobid) && isNullorEmpty(serviceid)) {
                    $('.admin_fees_rate').val(9);
                    $('.admin_fees_qty').val(1);
                    $('.admin_fees_total').val(9);
                } else {
                    var service_old_record = record.load({
                        type: 'customrecord_service',
                        id: serviceid,
                    });

                    var admin_fees = parseFloat(service_old_record.getValue({ fieldId: 'custrecord_service_price' }));

                    var admin_fees_qty = 1;

                    if (!isNullorEmpty(jobid)) {
                        var job_old_record = record.load({
                            type: 'customrecord_job',
                            id: jobid,
                        });

                        admin_fees_qty = parseFloat(job_old_record.getValue({ fieldId: 'custrecord_job_extras_qty' }));
                    }

                    $('.admin_fees_rate').val(admin_fees);
                    $('.admin_fees_qty').val(admin_fees_qty);
                    $('.admin_fees_total').val((admin_fees * admin_fees_qty));
                }

                admin_fees_log = true;

                updateTotal();
            });

            /**
             * [description] - To hide the Admin Fee Row
             */
            $('.admin_fees_off').click(function() {
                $('.admin_fees_row').hide();
                // $('.admin_fees_rate').val(0);
                // $('.admin_fees_qty').val(0);
                var jobid = $('.admin_fees_rate').attr('data-jobid');
                var serviceid = $('.admin_fees_rate').attr('data-serviceid');

                // $('.admin_fees_total').val(0);

                admin_fees_log = false;

                if (!isNullorEmpty(jobid)) {
                    deleted_job_ids[deleted_job_ids.length] = jobid;
                }

                if (!isNullorEmpty(serviceid)) {

                    deleted_service_ids[deleted_service_ids.length] = serviceid;
                }

                updateTotal();
            });




            
        }

        //ON CLICK OF THE APP COMPELTED QTY
        function onclick_StatusComplete(internal_id, service_rate, service_id, job_group, status, category, package_id, assign_packge) {

            //setReviewDate(internal_id); //REVIEW DATE IS SET FOR ALL THE JOBS

            var currentScript = currentRecord.get();
            if (status == null) {
                var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_job_page', deploymentId: 'customdeploy_job_page' }) + '&customer_id=' + internal_id + '&rate=' + service_rate + '&service_id=' + service_id + '&job_group=' + job_group + '&category=' + category + '&package=' + package_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&assign_packge=' + assign_packge + '&locked=' + global_locked + '&sc=' + currentScript.getValue({ fieldId: 'scid' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
                window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
            } else {
                var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_job_page', deploymentId: 'customdeploy_job_page' }) + '&customer_id=' + internal_id + '&rate=' + service_rate + '&service_id=' + service_id + '&job_group=' + job_group + '&status=' + status + '&category=' + category + '&package=' + package_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&assign_packge=' + assign_packge + '&locked=' + global_locked + '&sc=' + currentScript.getValue({ fieldId: 'scid' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
                window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
            }
        }

        //ON CLICK OF THE APP PARTIALLY COMPLETED QTY
        function onclick_StatusPartial(internal_id, service_rate, service_id, job_group, status, category, package_id) {
            var currentScript = currentRecord.get();
            //setReviewDate(internal_id);

            var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_job_page', deploymentId: 'customdeploy_job_page' }) + '&customer_id=' + internal_id + '&rate=' + service_rate + '&service_id=' + service_id + '&job_group=' + job_group + '&status=' + status + '&category=' + category + '&package=' + package_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&locked=' + global_locked + '&sc=' + currentScript.getValue({ fieldId: 'scid' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }

        //ON CLICK OF THE APP INCOMPLETE QTY
        function onclick_StatusIncomplete(internal_id, service_rate, service_id, job_group, status, category, package_id) {
            var currentScript = currentRecord.get();
            // setReviewDate(internal_id);

            var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_job_page', deploymentId: 'customdeploy_job_page' }) + '&customer_id=' + internal_id + '&rate=' + service_rate + '&service_id=' + service_id + '&job_group=' + job_group + '&status=' + status + '&category=' + category + '&package=' + package_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&locked=' + global_locked + '&sc=' + currentScript.getValue({ fieldId: 'scid' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }

        //ON CLICK OF THE BACK TO SUMMARY BUTTON
        function onclick_summaryPage() {
            var currentScript = currentRecord.get();
            var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_summary_page', deploymentId: 'customdeploy_summary_page' }) + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }

        //ON CLICK OF ADD SERVICES BUTTON
        function addService(service_cat) {
            var currentScript = currentRecord.get();
            //setReviewDate(currentScript.getValue({ fieldId: 'customer_id')) };

            var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_add_service', deploymentId: 'customdeploy_sl_add_service' }) + '&custid=' + currentScript.getValue({ fieldId: 'customer_id' }) + '&unlayered=T&service_cat=' + service_cat + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' }) + '&locked=' + global_locked + '&sc=' + currentScript.getValue({ fieldId: 'scid' }) + '&zee=' + currentScript.getValue({ fieldId: 'zee_id' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");
        }

        //SET REVIEW DATE FUNCTION
        function setReviewDate(internal_id) {
            var currentScript = currentRecord.get();

            var searched_jobs = search.load({
                id: 'customsearch_inv_review_jobs_uninv',
                type: 'customrecord_job'
            });


            searched_jobs.filters.push(search.createFilter({
                name: 'custrecord_job_customer',
                operator: search.Operator.IS,
                values: internal_id,
            }));

            var resultSet = searched_jobs.run();


            resultSet.each(function(searchResult) {

                var job_record = record.load({
                    type: 'customrecord_job',
                    id: searchResult.getValue('internalid')
                });

                job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });

                job_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                })

                return true;
            });

            return true;

        }

        function onclick_AssignPackage(internal_id, service_rate, service_id, job_group, status, category, package_id) {
            var currentScript = currentRecord.get();
            var upload_url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_assign_package', deploymentId: 'customdeploy_sl_assign_package' }) + '&customer_id=' + internal_id + '&service_id=' + service_id + '&job_group=' + job_group + '&status=' + status + '&rate=' + service_rate + '&category=' + category + '&package=' + package_id + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' });
            window.open(upload_url, "_self", "height=750,width=650,modal=yes,alwaysRaised=yes");

        }

        function submit_package() {
            var currentScript = currentRecord.get();
            var url = baseURL + url.resolveScript({ scriptId: 'customscript_sl_services_main_page', deploymentId: 'customdeploy_sl_services_main_page' }) + '&customer_id=' + currentScript.getValue({ fieldId: 'customer_id' }) + '&start_date=' + currentScript.getValue({ fieldId: 'start_date' }) + '&end_date=' + currentScript.getValue({ fieldId: 'end_date' });
            window.open(url, "_self", "height=680,width=640,modal=yes,alwaysRaised=yes");

        }

        //FUNCTION TO CALCULATE THE TOTAL INVOICEABLE AMOUNT FOR EACH AND EVERY SERVICE AND EXTRA
        function updateServiceAmount(rate, qty) {

            return (rate * qty);

        }

        function onclick_review() {
            var currentScript = currentRecord.get();
            currentScript.setValue({ fieldId: 'review_button', value: 'T' });
            $('#submitter').trigger('click');
        }

        //ON CLICK OF NEXT CUSTOMER BUTTON
        function saveRecord(context) {
            var currentScript = currentRecord.get();

            var customer_id = currentScript.getValue({ fieldId: 'customer_id' });

            //WS Edit: Get Zee Customer from hidden field in Suitelet
            var zee_cust = parseInt(currentScript.getValue({ fieldId: 'zee_cust' }));

            //WS Edit: Can be deferred to Admin Fee section
            //var customerRec = record.load({ type: 'customer', id: customer_id });

            //WS Edit: zee (from global variable) instead of franchisee
            //var franchisee = customerRec.getValue({ fieldId: 'partner' });
            var franchisee = parseInt(zee);

            /*-----------------Derive CommReg for new Service Creation-----------------*/


            var commReg_search = search.load({
                id: 'customsearch_service_commreg_assign',
                type: 'customrecord_commencement_register'
            });

            //WS Edit: filterExpression unsets existing filter

            commReg_search.filters.push(search.createFilter({ name: 'custrecord_customer', operator: search.Operator.ANYOF, values: customer_id } ));
            commReg_search.filters.push(search.createFilter({ name: 'custrecord_franchisee', operator: search.Operator.ANYOF, values: franchisee } ));

            var comm_reg_results = commReg_search.run();

            var count_commReg = 0;
            var commReg = null;

            comm_reg_results.each(function(searchResult) {
                count_commReg++;

                /**
                 * [if description] - Only the latest comm Reg needs to be assigned
                 */
                if (count_commReg == 1) {
                    commReg = searchResult.getValue('internalid');
                }

                /**
                 * [if description] - if more than one Comm Reg, error mail is sent
                 */
                if (count_commReg > 1) {
                    //WS Comment: Needs error
                    error.create({
                        message: 'More than 1 Active CommReg',
                        name: 'Customer ID: ' + customer_id,
                    });

                    return false;
                }
                return true;
            });

            /*-----------------NS Qty-----------------*/
            //Set the jobs for NS Qty items
            var package_invoiceable_qty_elem = document.getElementsByClassName("package_netsuite_qty");
            var job_description_elem = document.getElementsByClassName("job_description");
            var single_job_description_elem = document.getElementsByClassName("single_job_description");

            var service_id_array = [];
            var service_descp_array = [];
            var extra_service_id = [];
            var extra_qty = [];
            var extra_rate = [];
            var delete_job_id = [];
            var delete_service_id = [];

            var new_jobs_service_id = [];
            var new_jobs_rate = [];
            var new_jobs_qty = [];
            var new_jobs_cat = [];
            var new_jobs_descp = [];
            var new_jobs_package_id = [];
            var new_jobs_single_line = [];


            var new_service_type = [];
            var new_service_name = [];
            var new_service_price = [];
            var new_service_qty = [];
            var new_service_package_id = [];
            var new_service_customer = [];
            var new_service_comm_reg = [];
            var new_service_discount_type = [];
            var new_service_single_line = [];



            /*-----------------NS Qty: Get Field Values from Suitelet-----------------*/

            for (var i = 0; i < package_invoiceable_qty_elem.length; ++i) {
                console.log('saveRecord loop ' + i)
                var initial_changed_qty = package_invoiceable_qty_elem[i].value;
                console.log(initial_changed_qty)
                var initial_load_qty = package_invoiceable_qty_elem[i].getAttribute("data-oldqty");
                console.log(initial_load_qty)
                var service_id = package_invoiceable_qty_elem[i].getAttribute("data-serviceid");
                console.log(service_id)
                var service_rate = package_invoiceable_qty_elem[i].getAttribute("data-rate");
                console.log(service_rate)
                var service_cat = package_invoiceable_qty_elem[i].getAttribute("data-servicecat");
                console.log(service_cat)
                var package = package_invoiceable_qty_elem[i].getAttribute("data-packageid");
                console.log(package)
                var job_id = package_invoiceable_qty_elem[i].getAttribute("data-netsuitejob");
                console.log(job_id)

                var default_ns_qty = package_invoiceable_qty_elem[i].getAttribute("default-value");
                console.log(default_ns_qty)



                var default_description;
                var default_single_line;
                var single_line;
                var description;
                console.log(job_description_elem[i])
                if (!isNullorEmpty(job_description_elem[i])) {
                    if (!isNullorEmpty(job_description_elem[i].value)) {
                        var default_description = job_description_elem[i].getAttribute("default-value");
                        console.log(default_description)
                        var default_single_line = job_description_elem[i].getAttribute("default-singleline");
                        console.log(default_single_line)
                        var single_line = job_description_elem[i].getAttribute("data-singleline");
                        console.log(single_line)


                        service_id_array.push(job_description_elem[i].getAttribute("data-serviceid"));
                        console.log(job_description_elem[i].getAttribute("data-serviceid"))
                        service_descp_array.push(job_description_elem[i].value);

                        description = job_description_elem[i].value;
                    }
                }

                // single_line.push(job_description_elem[i].getAttribute("data-singleline"))


                var jobs_to_create = parseFloat(initial_changed_qty);

                /*-----------------Package: Identify and Create Jobs-----------------*/
                if (description != default_description || default_ns_qty != initial_changed_qty) {

                    if (jobs_to_create > 0 || !isNullorEmpty(description)) {

                        if (service_id != 242 && service_id != 243 && service_id != 1904 && service_id != 241) {
                            if (isNullorEmpty(job_id) || job_id == 'null') {

                                if (zee == zee_cust) {

                                    createJobRecord(customer_id, service_id, service_rate, jobs_to_create, description, service_cat, package, single_line, null);

                                } else {
                                    new_jobs_service_id[new_jobs_service_id.length] = service_id;
                                    new_jobs_rate[new_jobs_rate.length] = service_rate;
                                    new_jobs_qty[new_jobs_qty.length] = jobs_to_create;
                                    new_jobs_cat[new_jobs_cat.length] = service_cat;
                                    new_jobs_descp[new_jobs_descp.length] = description;
                                    new_jobs_single_line[new_jobs_single_line.length] = single_line;
                                    if (!isNullorEmpty(package)) {
                                        new_jobs_package_id[new_jobs_package_id.length] = package;
                                    }
                                }

                            } else {
                                updateJobRecord(job_id, null, jobs_to_create, description, null, null, null, null);
                            }
                        } else {

                            extra_service_id[extra_service_id.length] = service_id;
                            extra_qty[extra_qty.length] = jobs_to_create;
                            extra_rate[extra_rate.length] = service_rate;
                        }
                    } else if (jobs_to_create == 0 && isNullorEmpty(description)) {
                        if (!isNullorEmpty(job_id) && job_id != 'null') {

                            delete_job_id[delete_job_id.length] = job_id;
                            // nlapiDeleteRecord('customrecord_job', job_id);
                        }

                    }
                }
            }

            var discount_type_elem = document.getElementsByClassName("discount_type");
            var discount_value_elem = document.getElementsByClassName("discount_value");
            var discount_qty_elem = document.getElementsByClassName("discount_qty");
            var total_discount_elem = document.getElementsByClassName("total_discount_value");
            var invoice_single_line_elem = document.getElementsByClassName("invoice_single_line");
            var total_package_value = document.getElementsByClassName("total_package_value");
            var single_line_hidden = document.getElementsByClassName("single_line_hidden");
            var fixed_discount_value = document.getElementsByClassName("fixed_discount_value");


            /*-----------------Package: Identify and Create Discount Services + Jobs-----------------*/
            if (!isNullorEmpty(total_discount_elem)) {
                for (var i = 0; i < total_discount_elem.length; ++i) {
                    var job_id = total_discount_elem[i].getAttribute('data-netsuitejob');
                    var default_description_value = single_job_description_elem[i].getAttribute('default-value');
                    var description_value = single_job_description_elem[i].value;
                    var default_total_discount_value = total_discount_elem[i].getAttribute('default-value');
                    var single_line_hidden_default = single_line_hidden[i].getAttribute('default-singleline');
                    var total_discount_value = total_discount_elem[i].value;
                    var single_line_hidden_value = single_line_hidden[i].value;

                    if (isNullorEmpty(single_line_hidden_value)) {
                        single_line_hidden_value = single_line_hidden_default;
                    }

                    if (isNullorEmpty(job_id) || job_id == 'null') {
                        if (total_discount_elem[i].hasAttribute("data-package")) {
                            var package_id = total_discount_elem[i].getAttribute('data-package');
                        }

                        var package_record = record.load({
                            type: 'customrecord_service_package',
                            id: package_id,
                        });

                        var discount_period = package_record.getValue({ fieldId: 'custrecord_service_package_disc_period' });


                        if (zee == zee_cust) {

                            var service_price;
                            if (discount_period == 3) {
                                service_price = total_package_value[i].value;
                            } else {
                                if (single_line_hidden_value == 1) {
                                    service_price = fixed_discount_value[i].value;
                                } else {
                                    service_price = discount_value_elem[i].value;
                                }
                            }
                            // alert(package_id);
                            var service_id = createServiceRecord(17, 'Discount', service_price, customer_id, commReg, package_id);

                            var service_rate;
                            var service_qty;
                            var discount_type;

                            if (discount_period == 3) {
                                service_rate = total_package_value[i].value;
                                service_qty = 1;
                            } else {
                                if (single_line_hidden_value == 1) {
                                    service_rate = fixed_discount_value[i].value;
                                } else {
                                    service_rate = discount_value_elem[i].value;
                                }

                                service_qty = discount_qty_elem[i].value;
                                if (!isNullorEmpty(discount_type_elem[i])) {
                                    if (isNullorEmpty(discount_type_elem[i].getAttribute('data-value'))) {
                                        discount_type = null;
                                    } else {
                                        discount_type = discount_type_elem[i].getAttribute('data-value');
                                    }

                                }
                            }


                            createJobRecord(customer_id, service_id, service_rate, service_qty, description, 2, package_id, invoice_single_line_elem[i].value, discount_type);


                        } else {

                            if (discount_period == 3) {
                                new_service_price[new_service_price.length] = total_package_value[i].value;
                                new_service_qty[new_service_qty.length] = 1;
                            } else {
                                if (single_line_hidden_value == 1) {
                                    new_service_price[new_service_price.length] = fixed_discount_value[i].value;
                                } else {
                                    new_service_price[new_service_price.length] = discount_value_elem[i].value;
                                }
                                new_service_qty[new_service_qty.length] = discount_qty_elem[i].value;

                                if (!isNullorEmpty(discount_type_elem[i])) {
                                    if (isNullorEmpty(discount_type_elem[i].getAttribute('data-value'))) {
                                        new_service_discount_type[new_service_discount_type.length] = null;
                                    } else {
                                        new_service_discount_type[new_service_discount_type.length] = discount_type_elem[i].getAttribute('data-value');
                                    }

                                }
                            }
                            if (!isNullorEmpty(package_id)) {
                                new_service_package_id[new_service_package_id.length] = package_id;

                            }
                            if (!isNullorEmpty(commReg)) {
                                new_service_comm_reg[new_service_comm_reg.length] = commReg;
                            }
                            new_service_customer[new_service_customer.length] = customer_id;
                            new_service_type[new_service_type.length] = 17;
                            new_service_name[new_service_name.length] = 'Discount';
                            new_service_single_line[new_service_single_line.length] = invoice_single_line_elem[i].value;
                        }
                    } else {
                        
                        var job_new_record = record.load({ type: 'customrecord_job', id: job_id });
                        var service_id = job_new_record.getValue({ fieldId: 'custrecord_job_service' });

                        if (total_discount_elem[i].hasAttribute("data-package")) {
                            var package_id = total_discount_elem[i].getAttribute('data-package');
                        }

                        var package_record = record.load({ type: 'customrecord_service_package', id: package_id });

                        var discount_period = package_record.getValue({ fieldId: 'custrecord_service_package_disc_period' });

                        var service_record = record.load({ type: 'customrecord_service', id: service_id });

                        if (discount_period == 3) {
                            service_record.setValue({ fieldId: 'custrecord_service_price', value: total_package_value[i].value });
                        } else {

                            if (single_line_hidden_value == 1) {
                                service_record.setValue({ fieldId: 'custrecord_service_price', value: fixed_discount_value[i].value });
                            } else {
                                service_record.setValue({ fieldId: 'custrecord_service_price', value: discount_value_elem[i].value });
                            }
                        }

                        if (!isNullorEmpty(package_id)) {
                            service_record.setValue({ fieldId: 'custrecord_service_package', value: package_id });

                        }

                        service_record.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });

                        var service_rate;
                        var service_qty;
                        var discount_type;

                        if (discount_period == 3) {
                            service_rate = total_package_value[i].value;
                            service_qty = 1;
                        } else {
                            if (single_line_hidden_value == 1) {
                                service_rate = fixed_discount_value[i].value;
                            } else {
                                service_rate = discount_value_elem[i].value;
                            }

                            service_qty = discount_qty_elem[i].value;
                            if (!isNullorEmpty(discount_type_elem[i])) {
                                if (isNullorEmpty(discount_type_elem[i].getAttribute('data-value'))) {
                                    discount_type = null;
                                } else {
                                    discount_type = discount_type_elem[i].getAttribute('data-value');
                                }

                            }
                        }

                        updateJobRecord(job_id, service_rate, service_qty, single_job_description_elem[i].value, null, package_id, invoice_single_line_elem[i].value, discount_type);
                    }
                }
            }

            /*-----------------Admin Fees-----------------*/

            //WS Edit: Only allow adjustments on Admin fee to be made by Customer Zee. Other Zee cannot update Admin fee arrangements.

            if (zee == zee_cust) {
                var customerRec = record.load({ type: 'customer', id: customer_id });

                var admin_fees_rate_elem = document.getElementsByClassName("admin_fees_rate");
                var admin_fees_qty_elem = document.getElementsByClassName("admin_fees_qty");

                /*-----------------Admin Fees: NO-----------------*/
                if (admin_fees_log == false || admin_fees_log == 'false') {
                    if (!isNullorEmpty(deleted_service_ids)) {
                        // alert(deleted_service_ids);
                        for (var i = 0; i < deleted_service_ids.length; i++) {

                            var searchedJobsResult = adminFeesServiceCheck(customer_id, deleted_service_ids[i], deleted_job_ids);

                            if (isNullorEmpty(searchedJobsResult)) {
                                delete_service_id[delete_service_id.length] = deleted_service_ids[i];
                            } else {
                                if (searchedJobsResult.length == 1) {
                                    var service_old_record = record.load({ type: 'customrecord_service', id: deleted_service_ids }[i]);

                                    service_old_record.setValue({ fieldId: 'isinactive', value: 'T' });

                                    service_old_record.save({
                                        enableSourcing: true,
                                        ignoreMandatoryFields: true
                                    });
                                    // delete_service_id[delete_service_id.length] = deleted_service_ids[i];
                                }

                            }

                        }
                    }

                    if (!isNullorEmpty(deleted_job_ids)) {
                        for (var i = 0; i < deleted_job_ids.length; i++) {
                            delete_job_id[delete_job_id.length] = deleted_job_ids[i];
                            // nlapiDeleteRecord('customrecord_job', deleted_job_ids[i]);
                        }
                    }

                    $('.admin_fees_rate').val(0);
                    $('.admin_fees_qty').val(0);

                    customerRec.setValue({ fieldId: 'custentity_admin_fees', value: null });
                }

                console.log('Before admin')
                    /*-----------------Admin Fees: YES-----------------*/
                    /**
                    * To capture the Admin Fee information
                    */
                if (admin_fees_log == true || admin_fees_log == 'true') {
                    for (var i = 0; i < admin_fees_rate_elem.length; ++i) {
                        var jobid = (admin_fees_rate_elem[i].getAttribute("data-jobid"));
                        var serviceid = (admin_fees_rate_elem[i].getAttribute("data-serviceid"));
                        var old_admin_fees = admin_fees_rate_elem[i].getAttribute("data-oldvalue");

                        var admin_fees = admin_fees_rate_elem[i].value;
                        var admin_qty = admin_fees_qty_elem[i].value;

                        if (isNullorEmpty(admin_fees) || admin_fees == 0 || isNullorEmpty(admin_qty) || admin_qty == 0) {
                            customerRec.setValue({ fieldId: 'custentity_admin_fees', value: null });
                            if (!isNullorEmpty(jobid)) {
                                delete_job_id[delete_job_id.length] = jobid;
                                // nlapiDeleteRecord('customrecord_job', jobid);
                            }

                            if (!isNullorEmpty(serviceid)) {
                                var searchedJobsResult = adminFeesServiceCheck(customer_id, serviceid, delete_job_id);

                                if (isNullorEmpty(searchedJobsResult)) {
                                    delete_service_id[delete_service_id.length] = serviceid;
                                } else {
                                    if (searchedJobsResult.length == 1) {
                                        var service_old_record = record.load({ type: 'customrecord_service', id: serviceid });

                                        service_old_record.setValue({ fieldId: 'isinactive', value: 'T' });

                                        service_old_record.save({
                                            enableSourcing: true,
                                            ignoreMandatoryFields: true
                                        });

                                        // delete_service_id[delete_service_id.length] = deleted_service_ids[i];
                                    }
                                }
                            }
                        } else {
                            if (!isNullorEmpty(deleted_service_ids)) {
                                for (var i = 0; i < deleted_service_ids.length; i++) {
                                    var searchedJobsResult = adminFeesServiceCheck(customer_id, deleted_service_ids[i], deleted_job_ids);

                                    if (isNullorEmpty(searchedJobsResult)) {
                                        delete_service_id[delete_service_id.length] = deleted_service_ids[i];
                                    } else {
                                        if (searchedJobsResult.length == 1) {
                                            var service_old_record = record.load({ type: 'customrecord_service', id: deleted_service_ids }[i]);

                                            service_old_record.setValue({ fieldId: 'isinactive', value: 'T' });

                                            service_old_record.save({
                                                enableSourcing: true,
                                                ignoreMandatoryFields: true
                                            });

                                            // delete_service_id[delete_service_id.length] = deleted_service_ids[i];
                                        }
                                    }
                                }
                            }

                            if (!isNullorEmpty(deleted_job_ids)) {
                                for (var i = 0; i < deleted_job_ids.length; i++) {
                                    delete_job_id[delete_job_id.length] = deleted_job_ids[i];
                                    // nlapiDeleteRecord('customrecord_job', deleted_job_ids[i]);
                                }
                            }
                            if (isNullorEmpty(serviceid)) {
                                //Put code to check if the Admin Fee Service with the Same Price exists or not. If it exists and is Inactive, activate it and update. If no service exists, create a new service
                                var searchedServicesResult = searchAdminFeesService(customer_id, admin_fees);

                                if (isNullorEmpty(searchedServicesResult)) {
                                    var service_record = record.create({
                                        type: 'customrecord_service',
                                        isDynamic: true,
                                    });
                                     
                                    service_record.setValue({ fieldId: 'custrecord_service', value: 22 });
                                    
                                    service_record.setValue({ fieldId: 'name', value:  search.lookupFields({ type: 'customrecord_service_type', id: 22, columns: 'name' }) });
                                    //WS Edit: cannot set franchisee in Client.
                                    //service_record.setValue({ fieldId: 'custrecord_service_franchisee', value: zee);
                                    service_record.setValue({ fieldId: 'custrecord_service_customer', value: customer_id });
                                    //WS } Edit: Need to deal with null commReg.
                                    //service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: commReg);
                                    if (!isNullorEmpty(commReg)) {
                                        service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: commReg });
                                    }
                                } else {
                                    if (searchedServicesResult.length == 1) {

                                        var service_record = record.load({ type: 'customrecord_service', id: searchedServicesResult[0].getValue('internalid') });
                                        service_record.setValue({ fieldId: 'isinactive', value: 'F' });
                                    } else {
                                        //Throw Error
                                    }
                                }
                            } else {
                                var service_record = record.load({ type: 'customrecord_service', id: serviceid });
                            }


                            service_record.setValue({ fieldId: 'custrecord_service_price', value: admin_fees });
                            var new_service_id = service_record.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });

                            if (isNullorEmpty(jobid)) {

                                var job_record = record.create({
                                    type: 'customrecord_job',
                                    isDynamic: true,
                                });

                                job_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
                                job_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                                job_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                                job_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
                                job_record.setValue({ fieldId: 'custrecord_job_service_category', value: 2 });
                                job_record.setValue({ fieldId: 'custrecord_job_customer', value: customer_id });

                                // } job_record.setValue({ fieldId: 'custrecord_job_franchisee', value: zee);

                            } else {

                                var job_record = record.load({ type: 'customrecord_job', id: jobid });
                            }

                            job_record.setValue({ fieldId: 'custrecord_job_service', value: new_service_id });
                            job_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: admin_qty });
                            job_record.setValue({ fieldId: 'custrecord_job_service_price', value: admin_fees});
                            job_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: currentScript.getValue({ fieldId: 'end_date' }) });

                            job_record.save({
                                enableSourcing: true,
                                ignoreMandatoryFields: true
                            });

                            customerRec.setValue({ fieldId: 'custentity_admin_fees', value: admin_fees });
                        }
                    } }
                

                console.log('after admin')

                customerRec.setValue({ fieldId: 'custentity11', value: $('.customer_po').val() });
                customerRec.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

            }

            var extra_service_string = extra_service_id.join();
            var extra_qty_string = extra_qty.join();
            var extra_rate_string = extra_rate.join();

            console.log(delete_job_id);

            var unique_delete_jobs = removeDuplicateUsingFilter(delete_job_id);
            var unique_delete_services = removeDuplicateUsingFilter(delete_service_id);

            console.log(unique_delete_jobs);

            var delete_job_id_string = unique_delete_jobs.join();
            var delete_service_id_string = unique_delete_services.join();

            var new_jobs_service_id_string = new_jobs_service_id.join();
            var new_jobs_rate_string = new_jobs_rate.join();
            var new_jobs_qty_string = new_jobs_qty.join();
            var new_jobs_cat_string = new_jobs_cat.join();
            var new_jobs_descp_string = new_jobs_descp.join();
            var new_jobs_package_id_string = new_jobs_package_id.join();
            var new_jobs_single_line_string = new_jobs_single_line.join();


            var new_service_type_string = new_service_type.join();
            var new_service_name_string = new_service_name.join();
            var new_service_price_string = new_service_price.join();
            var new_service_qty_string = new_service_qty.join();
            var new_service_discount_type_string = new_service_discount_type.join();
            var new_service_package_id_string = new_service_package_id.join();
            var new_service_customer_string = new_service_customer.join();
            var new_service_comm_reg_string = new_service_comm_reg.join();
            var new_service_single_line_string = new_service_single_line.join();


            // alert(delete_service_id);

            
            currentScript.setValue({ fieldId: 'extra_service_string', value: extra_service_string });
            currentScript.setValue({ fieldId: 'extra_qty_string', value: extra_qty_string });
            currentScript.setValue({ fieldId: 'extra_rate_string', value: extra_rate_string });
            currentScript.setValue({ fieldId: 'delete_job_id_string', value: delete_job_id_string });
            currentScript.setValue({ fieldId: 'delete_service_id_string', value: delete_service_id_string });

            currentScript.setValue({ fieldId: 'new_jobs_service_id_string', value: new_jobs_service_id_string });
            currentScript.setValue({ fieldId: 'new_jobs_rate_string', value: new_jobs_rate_string });
            currentScript.setValue({ fieldId: 'new_jobs_qty_string', value: new_jobs_qty_string });
            currentScript.setValue({ fieldId: 'new_jobs_cat_string', value: new_jobs_cat_string });
            currentScript.setValue({ fieldId: 'new_jobs_descp_string', value: new_jobs_descp_string });
            currentScript.setValue({ fieldId: 'new_jobs_package_id_string', value: new_jobs_package_id_string });
            currentScript.setValue({ fieldId: 'new_jobs_single_line_string', value: new_jobs_single_line_string });

            currentScript.setValue({ fieldId: 'new_service_type_string', value: new_service_type_string });
            currentScript.setValue({ fieldId: 'new_service_name_string', value: new_service_name_string });
            currentScript.setValue({ fieldId: 'new_service_price_string', value: new_service_price_string });
            currentScript.setValue({ fieldId: 'new_service_qty_string', value: new_service_qty_string });
            currentScript.setValue({ fieldId: 'new_service_discount_type_string', value: new_service_discount_type_string });
            currentScript.setValue({ fieldId: 'new_service_package_id_string', value: new_service_package_id_string });
            currentScript.setValue({ fieldId: 'new_service_customer_string', value: new_service_customer_string });
            currentScript.setValue({ fieldId: 'new_service_comm_reg_string', value: new_service_comm_reg_string });
            currentScript.setValue({ fieldId: 'new_service_single_line_string', value: new_service_single_line_string });

            return true;
        }

        function adminFeesServiceCheck(customer_id, service_id, deleted_job_ids) {

            var searched_jobs = search.load({ id: 'customrecord_job', type: 'customsearch_job_inv_review_all' });
        

            searched_jobs.filters.push(search.createFilter({ name: 'custrecord_operator_franchisee',
                operator: search.Operator.ANYOF,
                values: zee,
            }));

            searched_jobs.filters.push(search.createFilter({ name: 'custrecord_job_customer', operator: search.Operator.IS, values: customer_id }));
            searched_jobs.filters.push(search.createFilter({ name: 'custrecord_job_service', operator: search.Operator.IS, values: service_id }));
            if (!isNullorEmpty(deleted_job_ids)) {
                searched_jobs.filters.push(search.createFilter({ name: 'internalid', operator: search.Operator.NONEOF, values: deleted_job_ids }));
            }
                
            var resultSet = searched_jobs.run();
        
            var searchedJobsResult = resultSet.getRange({
                start: 0,
                end: 1
            });
        
            return searchedJobsResult;
        }
        
        function searchAdminFeesService(customer_id, admin_fees) {
            var searched_services = search.load({ id: 'customrecord_service', type: 'customsearch_aic_review_services' });
        
            
            searched_services.filters.push(search.createFilter({ name: 'custrecord_service_customer', operator: search.Operator.IS, values: customer_id }));
            searched_services.filters.push(search.createFilter({ name: 'custrecord_service', operator: search.Operator.IS, values: 22 }));
            searched_services.filters.push(search.createFilter({ name: 'custrecord_service_price', operator: search.Operator.EQUALTO, values: admin_fees }));
                
            var resultSet = searched_services.run();
        
            var searchedServicesResult = resultSet.getRange({
                start: 0,
                end: 2
            });
        
            return searchedServicesResult;
        }
        
        //FUNCTION TO CALCULATE THE TOTAL INVOICE FOR THE CUSTOMER
        function updateTotal() {
            var total_invoice = 0.0;
            var total_package_elem = document.getElementsByClassName("total_package_value");
            var total_service_elem = document.getElementsByClassName("service_total");
            var admin_fees_total_elem = document.getElementsByClassName("admin_fees_total");
            var customer_admin_fees = document.getElementsByClassName("customer_admin_fees");
        
        
            for (var i = 0; i < total_package_elem.length; ++i) {
                if (typeof total_package_elem[i].value !== "undefined") {
                    total_invoice = total_invoice + parseFloat(total_package_elem[i].value);
                }
            }
        
            for (var i = 0; i < total_service_elem.length; ++i) {
                if (typeof total_service_elem[i].value !== "undefined") {
                    total_invoice = total_invoice + parseFloat(total_service_elem[i].value);
                }
            }
        
            if (admin_fees_log == true || admin_fees_log == 'true') {
                for (var i = 0; i < admin_fees_total_elem.length; ++i) {
                    // console.log(admin_fees_total_elem[i].value)
                    if (typeof admin_fees_total_elem[i].value !== "undefined" && admin_fees_total_elem[i].value != "NaN") {
                        total_invoice = total_invoice + parseFloat(admin_fees_total_elem[i].value);
                    }
                }
            }
        
        
            $('.total_value').val(total_invoice);
        }
        
                
        function GetFormattedDate(stringDate) {
            
            var todayDate = format.parse({ value: stringDate, type: format.Type.DATE });
            var month = pad(todayDate.getMonth() + 1);
            var day = pad(todayDate.getDate());
            var year = (todayDate.getFullYear());
            return year + "-" + month + "-" + day;
        }

        function pad(s) {
            return (s < 10) ? '0' + s : s;
        }


        function finalise_date(start_date) {

            var split_date = start_date.split('/');

            var date = new Date();

            var month = date.getMonth(); //Months 0 - 11
            var today = date.getDate();
            var year = date.getFullYear();

            var lastDay = new Date(split_date[2], split_date[1], 0);
            var currentLastDay = new Date(year, (month + 1), 0);


            if (lastDay.getDay() == 0) {
                lastDay.setDate(lastDay.getDate() - 2);
            } else if (lastDay.getDay() == 6) {
                lastDay.setDate(lastDay.getDate() - 1);
            }

            var lastWorkingDay = lastDay.getDate();

            var lastWorkingDayPlus5 = new Date();

            lastDay.setDate(lastDay.getDate() + 5);

            var button = false;

            console.log(parseInt(year) === parseInt(split_date[2]));
            console.log(parseInt(split_date[1]) === parseInt(month + 1));
            console.log(today < lastWorkingDay);


            //If allocator run on the first day of the month, it takes the last month as the filter
            if (parseInt(year) === parseInt(split_date[2]) && parseInt(split_date[1]) === parseInt(month + 1) && today < lastWorkingDay) {
                console.log('inside')
            } else if ((lastWorkingDay == today || today <= currentLastDay.getDate())) {
                console.log('inside 2')
                button = true;
            }
            return button;
        }


        function createServiceRecord(service_type, service_name, price, customer_id, commReg, package_id) {

            try {
                var new_service_record = record.create({
                    type: 'customrecord_service',
                    isDynamic: true,
                });
                
                new_service_record.setValue({ fieldId: 'custrecord_service', value: service_type });
                new_service_record.setValue({ fieldId: 'name', value: service_name });
        
                new_service_record.setValue({ fieldId: 'custrecord_service_price', value: price });
        
                new_service_record.setValue({ fieldId: 'custrecord_service_customer', value: customer_id });
                if (!isNullorEmpty(commReg)) {
                    new_service_record.setValue({ fieldId: 'custrecord_service_comm_reg', value: commReg });
                }
        
                if (!isNullorEmpty(package_id)) {
                    new_service_record.setValue({ fieldId: 'custrecord_service_package', value: package_id });
        
                }
        
                var service_id = new_service_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
        
                return service_id;
            } catch (e) {
                var message = '';
                message += "Customer Internal ID: " + customer_id + "</br>";
                message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customer_id + "'> View Customer </a></br>";
                message += "----------------------------------------------------------------------------------</br>";
                message += "Service Type: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=949&id=" + service_type + "'> View Service Type</a></br>";
                message += "----------------------------------------------------------------------------------</br>";
                message += e;
        
        
                email.send({
                    author: 409635,
                    body: message,
                    recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                    subject: 'AIC Review Page - Service Creation - Unable to create Service',
                });
        
                return false;
            }
        }
        
        function createJobRecord(customer_id, service_id, rate, qty, description, category, package_id, invoice_single_line, discount_type) {
            var currentScript = currentRecord.get();
            try {
                // alert(package_id)
                var job_new_record = record.create({
                    type: 'customrecord_job',
                    isDynamic: true,
                });
        
                job_new_record.setValue({ fieldId: 'custrecord_job_customer', value: customer_id });
                // job_new_record.setValue({ fieldId: 'custrecord_job_franchisee', value: zee });
                job_new_record.setValue({ fieldId: 'custrecord_job_service', value: service_id });
                job_new_record.setValue({ fieldId: 'custrecord_job_service_price', value: rate });
                job_new_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: qty });
                job_new_record.setValue({ fieldId: 'custrecord_job_status', value: 3 });
                job_new_record.setValue({ fieldId: 'custrecord_job_invoiceable', value: 1 });
                job_new_record.setValue({ fieldId: 'custrecord_job_date_reviewed', value: getDate() });
                job_new_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
                job_new_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: description });
                job_new_record.setValue({ fieldId: 'custrecord_job_date_scheduled', value: currentScript.getValue({ fieldId: 'end_date' }) });
                if (category == '1') {
                    job_new_record.setValue({ fieldId: 'custrecord_job_group_status', value: 'Completed' });
                }
                if (!isNullorEmpty(package_id)) {
                    job_new_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
                    job_new_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_line });
                }
                job_new_record.setValue({ fieldId: 'custrecord_job_service_category', value: category });
                job_new_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
        
                job_new_record.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

            } catch (e) {
                var message = '';
                message += "Customer Internal ID: " + customer_id + "</br>";
                message += "Customer:  <a href ='https://1048144.app.netsuite.com/app/common/entity/custjob.nl?id=" + customer_id + "'> View Customer </a></br>";
                message += "----------------------------------------------------------------------------------</br>";
                if (!isNullorEmpty(service_id) || service_id != false) {
                    message += "Service: <a href ='https://1048144.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=946&id=" + service_id + "'> View Service Type</a></br>";
        
                    message += "----------------------------------------------------------------------------------</br>";
                }
                message += e;
        
        
                email.send({
                    author: 409635,
                    body: message,
                    recipients: ['ankith.ravindran@mailplus.com.au', 'willian.suryadharma@mailplus.com.au'],
                    subject: 'AIC Review Page - Job Creation - Unable to create Job'
                });
        
                // return false;
            }
        }
        
        function updateJobRecord(job_id, rate, qty, description, category, package_id, invoice_single_line, discount_type) {
            var job_record = record.load({
                type: 'customrecord_job',
                id: job_id,
            });
            job_record.setValue({ fieldId: 'custrecord_job_extras_qty', value: qty });
            job_record.setValue({ fieldId: 'custrecord_job_source', value: 5 });
            job_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: description });
            if (!isNullorEmpty(package_id)) {
                job_record.setValue({ fieldId: 'custrecord_job_service_package', value: package_id });
        
            }
            if (!isNullorEmpty(rate)) {
                job_record.setValue({ fieldId: 'custrecord_job_service_price', value: rate });
            }
        
            job_record.setValue({ fieldId: 'custrecord_job_invoice_detail', value: description });
            job_record.setValue({ fieldId: 'custrecord_job_invoice_single_line_item', value: invoice_single_line });
            job_record.setValue({ fieldId: 'custrecord_job_discount_type', value: discount_type });
            
            job_record.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

        }
        
        function removeDuplicateUsingFilter(arr) {
            var unique_array = [];
            for (var i = 0; i < arr.length; i++) {
                if (unique_array.indexOf(arr[i]) == -1) {
                    unique_array.push(arr[i]);
                }
            }
            return unique_array
        }
        function isNullorEmpty(strVal) {
            return (strVal == null || strVal == '' || strVal == 'null' || strVal == undefined || strVal == 'undefined' || strVal == '- None -');
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            
        };  
    }
  
      
);