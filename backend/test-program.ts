import axios from "axios";

async function run() {
    try {
        const testEmail = "testuser_404@example.com";
        const logRes = await axios.post("http://localhost:3000/api/v1/auth/login", {
            email: testEmail,
            password: "password123"
        });
        const token = logRes.data.token;
        
        async function fetchPath(method: "get" | "patch", path: string) {
            console.log(`\nFetching ${method.toUpperCase()} ${path} ...`);
            try {
                const res = await axios({
                    method,
                    url: `http://localhost:3000${path}`,
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("SUCCESS:", res.status);
            } catch (e: any) {
                console.log("ERROR:", e.response?.status, e.response?.data);
            }
        }

        await fetchPath("patch", "/api/v1/programs/12345/visibility");
        await fetchPath("patch", "/api/v1/programs/12345/advance-day");

    } catch (e: any) {
        console.log("Outer Error:", e.response?.data || e.message);
    }
}
run();
