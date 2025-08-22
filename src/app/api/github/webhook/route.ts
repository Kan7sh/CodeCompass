export async function POST(req: Request) {
  const body = await req.json();

  if (
    body.action === "opened" &&
    body.pull_request?.base?.ref === "master" 
  ) {
    console.log(
      `PR #${body.pull_request.number} opened on ${body.repository.full_name}`
    );
    console.log(`Title: ${body.pull_request.title}`);
    console.log(`By: ${body.sender.login}`);
  }

  return new Response("ok");
}
