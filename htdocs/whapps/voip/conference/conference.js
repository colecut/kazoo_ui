winkstart.module('voip', 'conference', {
        css: [
            'css/style.css'
        ],

        templates: {
            conference: 'tmpl/conference.html',
            edit: 'tmpl/edit.html'
        },

        subscribe: {
            'conference.activate': 'activate',
            'conference.edit': 'edit_conference'
        },

        resources: {
            'conference.list': {
                url: '{api_url}/accounts/{account_id}/conferences',
                contentType: 'application/json',
                verb: 'GET'
            },
            'conference.get': {
                url: '{api_url}/accounts/{account_id}/conferences/{conference_id}',
                contentType: 'application/json',
                verb: 'GET'
            },
            'conference.create': {
                url: '{api_url}/accounts/{account_id}/conferences',
                contentType: 'application/json',
                verb: 'PUT'
            },
            'conference.update': {
                url: '{api_url}/accounts/{account_id}/conferences/{conference_id}',
                contentType: 'application/json',
                verb: 'POST'
            },
            'conference.delete': {
                url: '{api_url}/accounts/{account_id}/conferences/{conference_id}',
                contentType: 'application/json',
                verb: 'DELETE'
            },
            'user.list': {
                url: '{api_url}/accounts/{account_id}/users',
                contentType: 'application/json',
                verb: 'GET'
            }
        },

        validation: [
            { name: '#name',                  regex: /^.+$/ },
            { name: '#member_pins_string',    regex: /^[a-z0-9A-Z,\s]*$/ },
            { name: '#member_numbers_string', regex: /^[0-9,\s]+$/ }
        ]
    },
    function(args) {
        var THIS = this;

        winkstart.registerResources(this.__whapp, this.config.resources);

        winkstart.publish('subnav.add', {
            whapp: 'voip',
            module: this.__module,
            label: 'Conferences',
            icon: 'conference',
            weight: '05'
        });
    },
    {
        letters_to_numbers: function(string) {
            var result = '';

            $.each(string.split(''), function(index, value) {
                if(value.match(/^[aAbBcC]$/)) {
                    result += '2';
                }
                else if(value.match(/^[dDeEfF]$/)) {
                    result += '3';
                }
                else if(value.match(/^[gGhHiI]$/)) {
                    result += '4';
                }
                else if(value.match(/^[jJkKlL]$/)) {
                    result += '5';
                }
                else if(value.match(/^[mMnNoO]$/)) {
                    result += '6';
                }
                else if(value.match(/^[pPqQrRsS]$/)) {
                    result += '7';
                }
                else if(value.match(/^[tTuUvV]$/)) {
                    result += '8';
                }
                else if(value.match(/^[wWxXyYzZ]$/)) {
                    result += '9';
                }
                else {
                    result += value;
                }
            });

            return result;
        },

        save_conference: function(form_data, data, success, error) {
            var THIS = this,
                normalized_data = THIS.normalize_data($.extend(true, {}, data.data, form_data));

            if(typeof data.data == 'object' && data.data.id) {
                winkstart.request(true, 'conference.update', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        conference_id: data.data.id,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'update');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'update');
                        }
                    }
                );
            }
            else {
                winkstart.request(true, 'conference.create', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        data: normalized_data
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status, 'create');
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status, 'create');
                        }
                    }
                );
            }
        },

        edit_conference: function(data, _parent, _target, _callbacks){
            var THIS = this,
                parent = _parent || $('#conference-content'),
                target = _target || $('#conference-view', parent),
                _callbacks = _callbacks || {},
                callbacks = {
                    save_success: _callbacks.save_success || function(_data) {
                        THIS.render_list(parent);

                        THIS.edit_conference({ id: _data.data.id }, parent, target, callbacks);
                    },

                    save_error: _callbacks.save_error,

                    delete_success: _callbacks.delete_success || function() {
                        target.empty(),

                        THIS.render_list(parent);
                    },

                    delete_error: _callbacks.delete_error,

                    after_render: _callbacks.after_render
                },
                defaults = {
                    data: {
                        member_play_name: true,
                        member: {}
                    },
                    field_data: {
                        users: []
                    }
                };

            winkstart.request(true, 'user.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(_data, status) {
                    _data.data.unshift({
                        id: '',
                        first_name: '- No',
                        last_name: 'owner -'
                    });

                    defaults.field_data.users = _data.data;

                    if(typeof data == 'object' && data.id) {
                        winkstart.request(true, 'conference.get', {
                                account_id: winkstart.apps['voip'].account_id,
                                api_url: winkstart.apps['voip'].api_url,
                                conference_id: data.id
                            },
                            function(_data, status) {
                                THIS.migrate_data(_data);

                                THIS.format_data(_data);

                                THIS.render_conference($.extend(true, defaults, _data), target, callbacks);

                                if(typeof callbacks.after_render == 'function') {
                                    callbacks.after_render();
                                }
                            }
                        );
                    }
                    else {
                        THIS.render_conference(defaults, target, callbacks);

                        if(typeof callbacks.after_render == 'function') {
                            callbacks.after_render();
                        }
                    }
                }
            );
        },

        delete_conference: function(data, success, error) {
            var THIS = this;

            if(data.data.id) {
                winkstart.request(true, 'conference.delete', {
                        account_id: winkstart.apps['voip'].account_id,
                        api_url: winkstart.apps['voip'].api_url,
                        conference_id: data.data.id
                    },
                    function(_data, status) {
                        if(typeof success == 'function') {
                            success(_data, status);
                        }
                    },
                    function(_data, status) {
                        if(typeof error == 'function') {
                            error(_data, status);
                        }
                    }
                );
            }
        },

        render_conference: function(data, target, callbacks){
            var THIS = this,
                conference_html = THIS.templates.edit.tmpl(data);

            winkstart.validate.set(THIS.config.validation, conference_html);

            $('*[tooltip]', conference_html).each(function() {
                $(this).tooltip({ attach: conference_html });
            });

            $('ul.settings1', conference_html).tabs($('.pane > div', conference_html));
            $('ul.settings2', conference_html).tabs($('.advanced_pane > div', conference_html));

            $('#name', conference_html).focus();

            $('.advanced_pane', conference_html).hide();
            $('.advanced_tabs_wrapper', conference_html).hide();

            $('#advanced_settings_link', conference_html).click(function() {
                if($(this).attr('enabled') === 'true') {
                    $(this).attr('enabled', 'false');
                    $('.advanced_pane', conference_html).slideToggle(function() {
                        $('.advanced_tabs_wrapper', conference_html).animate({width: 'toggle'});
                    });
                }
                else {
                    $(this).attr('enabled', 'true');

                    $('.advanced_tabs_wrapper', conference_html).animate({width: 'toggle'}, function() {
                        $('.advanced_pane', conference_html).slideToggle();
                    });
                }
            });

            $('.conference-save', conference_html).click(function(ev) {
                ev.preventDefault();

                winkstart.validate.is_valid(THIS.config.validation, conference_html, function() {
                        var form_data = form2object('conference-form');

                        THIS.clean_form_data(form_data);

                        if('field_data' in data) {
                            delete data.field_data;
                        }

                        THIS.save_conference(form_data, data, callbacks.save_success, callbacks.save_error);
                    },
                    function() {
                        alert('There were errors on the form, please correct!');
                    }
                );
            });

            $('.conference-delete', conference_html).click(function(ev) {
                ev.preventDefault();

                THIS.delete_conference(data, callbacks.delete_success, callbacks.delete_error);
            });

            (target)
                .empty()
                .append(conference_html);
        },

        migrate_data: function(data) {
            if($.isArray(data.data.conference_numbers)) {
                data.data.member.numbers = data.data.conference_numbers;

                delete data.data.conference_numbers;
            }

            return data;
        },

        format_data: function(data) {
            if(typeof data.data.member == 'object') {
                if($.isArray(data.data.member.pins)) {
                    data.data.member.pins_string = data.data.member.pins.join(', ');
                }

                if($.isArray(data.data.member.numbers)) {
                    data.data.member.numbers_string = data.data.member.numbers.join(', ');
                }
            }

            return data;
        },

        normalize_data: function(data) {
            if(!data.member.pins.length) {
                delete data.member.pins;
            }

            if(!data.member.numbers.length) {
                delete data.member.numbers;
            }

            delete data.member.pins_string;
            delete data.member.numbers_string;

            return data;
        },

        clean_form_data: function(form_data){
            var THIS = this;

            form_data.member.pins_string = THIS.letters_to_numbers(form_data.member.pins_string);

            form_data.member.pins = $.map(form_data.member.pins_string.split(','), function(val) {
                var pin = $.trim(val);

                if(pin != '') {
                    return pin;
                }
                else {
                    return null;
                }
            });

            form_data.member.numbers = $.map(form_data.member.numbers_string.split(','), function(val) {
                var number = $.trim(val);

                if(number != '') {
                    return number;
                }
                else {
                    return null;
                }
            });

            return form_data;
        },

        render_list: function(parent){
            var THIS = this;

            winkstart.request(true, 'conference.list', {
                    account_id: winkstart.apps['voip'].account_id,
                    api_url: winkstart.apps['voip'].api_url
                },
                function(data, status) {
                    var map_crossbar_data = function(data) {
                        var new_list = [];

                        if(data.length > 0) {
                            $.each(data, function(key, val) {
                                new_list.push({
                                    id: val.id,
                                    title: val.name || '(name)'
                                });
                            });
                        }

                        new_list.sort(function(a, b) {
                            return a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1;
                        });

                        return new_list;
                };

                $('#conference-listpanel', parent)
                    .empty()
                    .listpanel({
                        label: 'Conferences',
                        identifier: 'conference-listview',
                        new_entity_label: 'Add Conference',
                        data: map_crossbar_data(data.data),
                        publisher: winkstart.publish,
                        notifyMethod: 'conference.edit',
                        notifyCreateMethod: 'conference.edit',
                        notifyParent: parent
                    });
               });
        },

        activate: function(parent) {
            var THIS = this,
                conference_html = THIS.templates.conference.tmpl();

            (parent || $('#ws-content'))
                .empty()
                .append(conference_html);

            THIS.render_list(conference_html);
        }
    }
);
