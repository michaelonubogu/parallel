(function () {
    $(document).ready(function () {
        var url = window.lfg.config.fayeDevUrl;
        
        switch (window.lfg.config.env.toLowerCase()) {
            case 'test':
                url = window.lfg.config.fayeTestUrl;
                break;

            case 'prod':
                url = window.lfg.config.fayeProdUrl;
                break;
        }

        var faye_client = new Faye.Client(url);
              
        //Callback Email verification sent
        var faye_subscription = faye_client.subscribe('/verificationSent', function (message) {
            if (message && message.emailSent) {
                Materialize.toast('Verification Email Sent', 4000);
            }
        });
    })
})();