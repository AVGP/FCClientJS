function getImageInfo(image_uid) {
            var msg = '<?xml version="1.0" encoding="utf-8"?><ImageInfoRequestUid><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
                    '<img_uid>' + image_uid + '</img_uid></ImageInfoRequestUid>';

            $.support.cors = true;
            $.ajax({
                crossDomain: true,
                url: 'http://www.betafaceapi.com/service.svc/GetImageInfo',
                type: 'post',
                contentType: 'application/xml',
                processData: false,
                data: msg,
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    var xmlDocRoot = $.parseXML(jqXHR.responseText);
                    var xmlDoc = $(xmlDocRoot).children("BetafaceImageInfoResponse");
                    var int_response = parseInt($(xmlDoc).children("int_response").text());
                    var string_response = $(xmlDoc).children("string_response").text();
                    if (int_response == 1) {
                        console.log("queued");
                        //image is in the queue
//                        doUpdateImage(image_uid, 'in queue', 0);
                        setTimeout(function () { getImageInfo(image_uid); }, 500);
                    }
                    else if (int_response == 0) {
                        console.log("DONE", xmlDoc);
                        window.faces = xmlDoc[0].querySelector("faces");
                        var known_uids = [];
                        for(var i=0; i< KNOWN_PEOPLE.length; i++) {
                            known_uids.push(KNOWN_PEOPLE[i].uid);
                        }
                        recognizeImpl(window.faces.querySelector("uid").textContent, known_uids);
                        //image processed
//                        parseImageInfo(image_uid, xmlDoc);
                    }
                    else {
                        //error
//                        doUpdateImage(image_uid, string_response, 0);

                        console.info(int_response);
                        console.info(string_response);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.info(textStatus);
                    alert("OUCH: Error happened :C")
                }
            });
        }


        function uploadImageImpl(url, msg, image_filename, image) {
            $.support.cors = true;
            $.ajax({
                crossDomain: true,
                url: url,
                type: 'post',
                contentType: 'application/xml',
                processData: false,
                data: msg,
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    var xmlDocRoot = $.parseXML(jqXHR.responseText);
                    var xmlDoc = $(xmlDocRoot).children("BetafaceImageResponse");
                    var int_response = parseInt($(xmlDoc).children("int_response").text());
                    var string_response = $(xmlDoc).children("string_response").text();
                    if (int_response == 0) {
                        var image_uid = $(xmlDoc).children("img_uid").text();
                        console.log("SUCCESS");
                        getImageInfo(image_uid);
                        //doAddImage(image_uid, image_filename, image);
                    }
                    else {
                        //error
                        //doUpdateImage(image_uid, string_response, 0);
                        console.log("FAIL :(");
                        console.info(int_response);
                        console.info(string_response);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.info(textStatus);
                    alert("OUCH: error happened :(");
                }
            });
        }

function uploadImageFile(image_filename, image_data, detection_flags) {
            var prefix = ';base64,';
            var idx = image_data.indexOf(prefix);
            if (idx >= 0) {
                var base64_data = image_data.substring(idx + prefix.length);
                var msg = '<?xml version="1.0" encoding="utf-8"?><ImageRequestBinary xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
                            '<api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
                            '<detection_flags>' + detection_flags + '</detection_flags>' +
                            '<imagefile_data>' + base64_data + '</imagefile_data>' +
                            '<original_filename>' + image_filename + '</original_filename>' +
                            '</ImageRequestBinary>';

                uploadImageImpl('http://www.betafaceapi.com/service.svc/UploadNewImage_File', msg, image_filename, image_data);
            }
        }

function getRecognizeResult(recognize_uid) {
            var msg = '<?xml version="1.0" encoding="utf-8"?><RecognizeResultRequest><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>' +
                    '<recognize_uid>' + recognize_uid + '</recognize_uid></RecognizeResultRequest>';

            $.support.cors = true;
            $.ajax({
                crossDomain: true,
                url: 'http://www.betafaceapi.com/service.svc/GetRecognizeResult',
                type: 'post',
                contentType: 'application/xml',
                processData: false,
                data: msg,
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    var xmlDocRoot = $.parseXML(jqXHR.responseText);
                    var xmlDoc = $(xmlDocRoot).children("BetafaceRecognizeResponse");
                    var int_response = parseInt($(xmlDoc).children("int_response").text());
                    var string_response = $(xmlDoc).children("string_response").text();
/*
                    for (var i = window.Matches.length - 1; i > -1; i--) {
                        if (window.Matches[i].id === recognize_uid) {
                            window.Matches[i].status = string_response;
                        }
                    }*/
                    if (int_response == 1) {
                        //request is in the queue
                        console.log("Recog queued");
                        setTimeout(function () { getRecognizeResult(recognize_uid); }, 500);
                    }
                    else if (int_response == 0) {
                        //request processed
                        window.recognition = xmlDoc[0];
                        var found = false;                        
                        [].forEach.call(xmlDoc[0].querySelectorAll("PersonMatchInfo"), function(potentialMatch) {
                            if(potentialMatch.querySelector("is_match").textContent != "true" && 
                               parseFloat(potentialMatch.querySelector("confidence").textContent,10) < 0.5) return;
                            console.log(potentialMatch);
                            KNOWN_PEOPLE.forEach(function(person) {
                                if(potentialMatch.querySelector("face_uid").textContent == person.uid) {
                                    if(parseFloat(potentialMatch.querySelector("confidence").textContent,10) > 0.75) {
                                        alert("We know that person! It's " + person.name);
                                    } else {
                                        alert("Hmmm... it MAY be " + person.name);
                                    }
                                    found = true;
                                }
                            });
                        });
                        
                        if(!found) { alert("Sorry, no idea :(") }
                        
                        document.getElementById("state").textContent = "READY";
                        console.log("RECOG SUCCESS:", xmlDoc);
                    }
                    else {
                        //error
                        console.info(int_response);
                        console.info(string_response);
                        alert("OUCH: Error happened :(");
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.info(textStatus);
                    alert("OUCH, Error :(");
                }
            });
        }

function recognizeImpl(face_uid, targets) {
            var msg = '<?xml version="1.0" encoding="utf-8"?><FacesRecognizeRequest xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><api_key>d45fd466-51e2-4701-8da8-04351c872236</api_key><api_secret>171e8465-f548-401d-b63b-caf0dc28df5f</api_secret>';

            msg += '<faces_uids><guid xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">' + face_uid + '</guid></faces_uids>';
            msg += '<group_results>false</group_results><targets>';
            for (var i = 0; i < targets.length; i++) {
                msg += '<string xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">' + targets[i] + '</string>';
            }
            msg += '</targets>';        
            msg += '</FacesRecognizeRequest>';

            $.support.cors = true;
            $.ajax({
                crossDomain: true,
                url: 'http://www.betafaceapi.com/service.svc/Faces_Recognize',
                type: 'post',
                contentType: 'application/xml',
                processData: false,
                data: msg,
                dataType: 'xml',
                success: function (data, textStatus, jqXHR) {
                    var xmlDocRoot = $.parseXML(jqXHR.responseText);
                    var xmlDoc = $(xmlDocRoot).children("BetafaceRecognizeRequestResponse");
                    var int_response = parseInt($(xmlDoc).children("int_response").text());
                    var string_response = $(xmlDoc).children("string_response").text();
                    if (int_response == 0) {
                        var recognize_uid = $(xmlDoc).children("recognize_uid").text();
                        getRecognizeResult(recognize_uid);
                    }
                    else {
                        //error
                        console.info(int_response);
                        console.info(string_response);
                        alert("OUCH an error :(");
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.info(textStatus);
                    alert("OUCH an error :(");
                }
            });
        }
