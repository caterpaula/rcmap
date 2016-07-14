var country_name_map = {
         'Brunei Darussalam': 'Brunei',
         'Congo': 'Republic of the Congo',
         'Congo, The Democratic Republic of the': 'Democratic Republic of the Congo',
         "Cote D'Ivoire": 'Ivory Coast',
         'Falkland Islands (Malvinas)': 'Falkland Islands',
         'French Southern Territories': 'French Southern and Antarctic Lands',
         'Guinea-Bissa': 'Guinea Bissau',
         'Iran, Islamic Republic of': 'Iran',
         "Korea, Democratic People's Republic of": 'North Korea',
         'Korea, Republic of': 'South Korea',
         "Lao People's Democratic Republic": 'Laos',
         'Moldova, Republic of': 'Moldova',
         'Palestinian Territory': 'West Bank',
         'Russian Federation': 'Russia',
         'Serbia': 'Republic of Serbia',
         'Syrian Arab Republic': 'Syria',
         'Tanzania, United Republic of': 'United Republic of Tanzania',
         'Timor-Leste': 'East Timor',
         'United States': 'United States of America'
};


var world_map;
var open_con = []

var highlight_country = function(country_name) {
    return d3.select('path[data-country-name="' + country_name + '"]')
            .style('fill', '#00BCD3')
            .transition()
            .duration(5000)
            .style('fill', '#28303D');
};

var get_country_names = function() {
    var ret = [];
    d3.selectAll('path[data-country-name]')
        .each(function(d) {
            ret.push(d.properties.name);
        });
    return ret;
};

var addBubbles = function(bubbles) {
    var self = this;

    var projection = this._map.get('projection');
    var options = this.options.bubble_config;

    var bubbleContainer = this.svg.append('g').attr('class', 'bubbles');

    bubbleContainer
        .selectAll('circle.bubble')
        .data(bubbles)
        .enter()
        .append('svg:circle')
        .attr('cx', function(datum) {
            return projection([datum.longitude, datum.latitude])[0];
        })
        .attr('cy', function(datum, index) {
            return projection([datum.longitude, datum.latitude])[1];
        })
        .style('fill', function(datum) {
            var fillColor = self.getFillColor(datum);
            d3.select(this).attr('data-fill', fillColor);
            return fillColor;
        })
        .attr('class', 'bubble')
        .attr('r', 0)
        .transition()
        .duration(400)
        .attr('r', function(datum) {
            return datum.radius;
        })
        .each(function(d){
            var x = projection([d.longitude, d.latitude])[0];
            var y = projection([d.longitude, d.latitude])[1];
            var div = $('<div />')
                .css({
                    position:'absolute',
                    'top': y + 10,
                    'left': x + 10,
                    'color': self.getFillColor(d)
                })
                .addClass('popup-box')
                .animate({opacity: 0}, 4000, null, function() {
                    this.remove();
                });

            div.html(d.page_title);
            $('#map').append(div);
        });
};

function wikipediaSocket() {

}

wikipediaSocket.init = function(ws_url, lid) {
    this.connect = function() {
        
        var connection = new ReconnectingWebSocket(ws_url);
        this.connection = connection;
        
        connection.onmessage = function(resp) {
           
            var data = JSON.parse(resp.data);

            // -----------------------------------
            // Begin fake data from wikipedia
            if (!data.is_anon || data.ns !== 'Main')
                return;
                
            if (!data.geo_ip)
                return;

            var fillKey;
            var message;
            if (data.change_size > 0) {
                fillKey = 'verification';
                message = 'Verification'
            } else {
                fillKey = 'redemption';
                message = 'Redemption $' + (Math.round((Math.random() * (200 - 50) + 50) * 100) / 100);
            }
            // End fake data
            // -----------------------------------

            
            world_map.options.bubbles = world_map.options.bubbles.slice(-20);
                        
            $('.bubbles').animate({
                    opacity: 0,
                    radius: 10
                },
                40000,
                null,
                function(){
                    this.remove();
                }
            );
            
            world_map.addBubbles([{
                radius: 4,
                latitude: data.geo_ip.latitude,
                longitude: data.geo_ip.longitude,
                page_title: message,
                fillKey: fillKey
            }]);

            var country_hl = highlight_country(data.geo_ip.country_name);

            if (!country_hl[0][0])
                highlight_country(country_name_map[data.geo_ip.country_name]);
        };
    
    };
    this.close = function() {
        if (this.connection) {
            this.connection.close();
        }
    };
};

$(document).ready(function() {

    world_map = $("#map").datamap({
        scope: 'world',
        bubbles:[],
        geography_config: {
            borderColor: '#25717E', // map country borders
            highlightOnHover: false,
            popupOnHover: false
        },
        bubble_config: {
            borderWidth: 0,
            animate: true
        },
        fills: {
            'defaultFill': '#28303D', // map country fill 
            'verification': '#1DD577',
            'redemption': '#FF0C3E'
        }
    });
    
    var socket = new wikipediaSocket.init('ws://wikimon.hatnote.com:9000', 'en');
    if (!socket.connection || socket.connection.readyState == 3)
        socket.connect();
    
    world_map.addBubbles = addBubbles;
});