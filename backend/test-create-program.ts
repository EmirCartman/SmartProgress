import axios from "axios";

async function run() {
    try {
        const testEmail = "testuser_404@example.com";
        const logRes = await axios.post("http://localhost:3000/api/v1/auth/login", {
            email: testEmail,
            password: "password123"
        });
        const token = logRes.data.token;
        
        const payload = {
            name: "Test Has Data Program",
            description: "Test description",
            isPublic: false,
            frequency: 3,
            data: {
               foo: "bar"
            }
        };

        const res = await axios.post("http://localhost:3000/api/v1/programs", payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS:", res.data);

    } catch (e: any) {
        console.log("ERROR:", e.response?.data || e.message);
    }
}
run();
