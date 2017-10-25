const axios = require('axios');

const onlinerFlatsUrl = "https://ak.api.onliner.by/search/points?rent_type%5B%5D=1_room&rent_type%5B%5D=2_rooms&price%5Bmin%5D=150&price%5Bmax%5D=400&currency=usd&limit=750&bounds%5Blb%5D%5Blat%5D=53.82740729409924&bounds%5Blb%5D%5Blong%5D=27.27218627929688&bounds%5Brt%5D%5Blat%5D=53.96941624926606&bounds%5Brt%5D%5Blong%5D=27.85171508789063"

function getFlatsFromOnliner() {
    return axios.get(onlinerFlatsUrl).then(response => response.data);
}

module.exports = getFlatsFromOnliner;