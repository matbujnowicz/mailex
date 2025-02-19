const { onRequest } = require('firebase-functions/v2/https');
const axios = require('axios');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const OpenAI = require('openai');
dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.ORG_ID,
});

exports.getProspects = onRequest(async (request, response) => {
  const { keywords, positions, locations } = request.body;
  console.log()

  if (!keywords || !positions || !locations) {
    return response.status(400).json({
      error: 'Missing required fields',
    });
  }

  if (!Array.isArray(keywords) || !Array.isArray(positions) || !Array.isArray(locations)) {
    return response.status(400).json({
      error: 'Keywords, positions, and locations must be arrays',
    });
  }

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'x-api-key': 'JSqrgvwAWntLIDmLjb5Y6w',
    },
  };

  let orgUrl = 'https://api.apollo.io/api/v1/mixed_companies/search?';

  // for (let i = 0; i < keywords.length; i++) {
  //   orgUrl += `q_organization_keyword_tags[]=${encodeURIComponent(keywords[i])}&`;
  // }

  // for (let i = 0; i < locations.length; i++) {
  //   orgUrl += `organization_locations[]=${encodeURIComponent(locations[i])}&`;
  // }

  let peopleUrl =
    'https://api.apollo.io/api/v1/mixed_people/search?contact_email_status[]=verified&contact_email_status[]=likely%20to%20engage&';

  for (let i = 0; i < positions.length; i++) {
    peopleUrl += `person_titles[]=${encodeURIComponent(positions[i])}&`;
  }
  for (let i = 0; i < locations.length; i++) {
    peopleUrl += `organization_locations[]=${encodeURIComponent(locations[i])}&`;
  }

  try {
    // const orgResult = await axios(orgUrl, options);

    // if (orgResult.data.organizations.length === 0) {
    //   return response.status(404).json({
    //     error: 'No organizations found',
    //   });
    // }

    // const organizations = orgResult.data.organizations.map((org) => ({ name: org.name, id: org.id }));

    // for (let i = 0; i < organizations.length; i++) {
    //   peopleUrl += `organization_ids[]=${encodeURIComponent(organizations[i].id)}&`;
    // }

    const peopleResult = await axios(peopleUrl, options);

    console.log(peopleResult.data);

    if (peopleResult.data.people.length === 0) {
      return response.status(404).json({
        error: 'No people found',
      });
    }
    console.log("done")

    const people = peopleResult.data.people.map((person) => ({
      name: person.name,
      linkedin_url: person.linkedin_url,
      email: person.email,
      country: person.country,
      city: person.city,
      organization_name: person.organization.name,
      title: person.title,
    }));

    return response.json(people);
  } catch (error) {
    console.error('Getting prospects', { error: error });

    response.status(500).json({ error: 'Failed to fetch data' });
  }
});

exports.sendMail = onRequest(async (req, res) => {
  const { email, subject, user_email, receiver_email, appPassword } = req.body;
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // or 'STARTTLS'
    auth: {
      user: user_email,
      pass: appPassword,
    },
  });
  const mailOptions = {
    from: user_email,
    to: receiver_email,
    subject: subject,
    text: email,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
  });
  res.json({
    message: 'Email sent successfully',
    status: 200,
  });
});
async function getLinkedinData(url) {
  console.log('linekdinstartedurl');
  const options = {
    method: 'GET',
    url: 'https://linkedin-api8.p.rapidapi.com/get-profile-data-by-url',
    params: {
      url: url,
    },
    headers: {
      'x-rapidapi-key': '78d9ef7540msha9b93eee54e1f13p152c24jsnd2aa3f7566c1',
      'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.request(options);

    return {
      username: response.data.username,
      name: `${response.data.firstName} ${response.data.lastName}`,
      position: {
        title: response.data.fullPositions[0].title,
        company: response.data.fullPositions[0].companyName,
      },
      summary: response.data.summary,
    };
  } catch (error) {
    console.error(error);
  }
}

async function getFirstPost(username) {
  console.log('linekdinstartedpost');

  const options = {
    method: 'GET',
    url: 'https://linkedin-api8.p.rapidapi.com/get-profile-posts',
    params: {
      username: username,
    },
    headers: {
      'x-rapidapi-key': '78d9ef7540msha9b93eee54e1f13p152c24jsnd2aa3f7566c1',
      'x-rapidapi-host': 'linkedin-api8.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.request(options);
    const posts = response.data.data;
    const firstPost = posts[0];
    return firstPost;
  } catch (error) {
    return error;
  }
}

async function generateMailbody(firstPost, name, job, summary, sender_name, sender_details) {
  console.log('emailbodystarted');

  const email_prompt = `
###Role
You are writing as ${sender_name}, ${sender_details} contacting ${name},
who holds the position ${job.title} at ${job.company} with a summary: ${summary}.

#Task
Create a short, personal outreach email that:

Maintains a conversational, professional, and approachable tone.
Starts with a friendly comment about the recipient's work or company.
Refer to their latest LinkedIn post ${firstPost} with a positive comment
End with a warm, open invitation to connect and ask for a short response like this "
I look forward to hearing from you, just a 1-2 line response would have made my day!
"

###Sample Email

Hi Jenny,
I have to say that I am very impressed with the work you do at SMS Smart Media Solutions. It is inspiring to see how your company is constantly striving for innovation in the AV industry.

I recently saw your post on LinkedIn about the nomination of the EVER Stand Series for an award in Germany. Great news! You have my vote of course, and I am not surprised by the nomination.

I would love to schedule a digital coffee meeting with you to talk about how the digital landscape is changing and how important it is to be at the forefront now that AI has accelerated development tenfold.

I look forward to hearing from you - a few lines from you would really make my day!

Kind regards,
${sender_name}
${sender_details}

###Notes
Do not include a subject line in the final result.
Keep the tone warm and non-salesy.
If any details are missing, stay neutral and general.
Avoid giving specific statistics or percentages.
Focus on connection and shared interests, not pitching services.
`;

  try {
    const res = await client.chat.completions.create({
      messages: [{ role: 'user', content: email_prompt }],
      model: 'gpt-4',
    });
    return res.choices[0].message.content;
  } catch (error) {
    console.error('Error in API call:', error);
    throw error;
  }
}

async function subejctGen(name) {
  console.log('emailsubject');
  const prompt = `
      ###role
      You are an email marketing expert and a specialist in creating engaging and clickable subject lines for outreach emails.

      ###Task
      Create a short, engaging subject line designed to grab the recipient's attention and increase the chance of them opening the email. Use the recipient's name- ${name}
      to make the subject line more personal and relevant.

      Sample subject lines:
      1. Regarding your latest LinkedIn post - had to share this with you, Charlotte
      2. Charlotte, your latest LinkedIn post made me think of this
      3. Charlotte, I saw what you wrote on LinkedIn and want to follow up
      4. Your latest LinkedIn post inspired me to send this
      5. Charlotte, regarding your LinkedIn post - I think this might interest you
      6. Saw your post on LinkedIn - this feels relevant to you, Charlotte
      7. I saw your latest LinkedIn post and thought of this

      ###Note
      – The subject line should be concise, engaging, and personal.
      – Avoid making it too general or too long.
      - Tailor the subject line to convey the main message of the email in a compelling way.
      - Do not use "Subject:" at the beginning of the subject line.
      - Avoid using quotation marks ("") in the final result.

        
  
  `;
  const res = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });
  const subject = res.choices[0].message.content;
  return subject;
}

async function convertHtml(email_body) {
  console.log('emailhtml');
  const prompt = ` 
      Here is the mail body: ${email_body}
      Your task is to:

      Add line breaks where appropriate using <br>.
      Replace any instance of **text** with <b>text</b>.

      ###Make sure the final output preserves the structure and formatting for improved readability in HTML.
      ### dont add any pretext or post text
      ###dont put the answer in """ """"
      
  `;
  const res = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
  });
  const html_body = res.choices[0].message.content;
  console.log(html_body);
  return html_body;
}

exports.generateMail = onRequest(async (req, res) => {
  try {
    const { linkedinURL, sender_name, sender_details } = req.body;


    const linkedinData = await getLinkedinData(linkedinURL);
    console.log(linkedinData);
    const firstPost = await getFirstPost(linkedinData.username);
    console.log(firstPost);
    const mail_body = await generateMailbody(
      firstPost,
      linkedinData.name,
      linkedinData.position,
      linkedinData.summary,
      sender_name,
      sender_details
    );
    console.log(mail_body);
    const subject_line = await subejctGen(linkedinData.name);
    console.log(subject_line);
    const html_body = await convertHtml(mail_body);
    console.log(html_body);

    res.json({
      body: html_body,
      subject: subject_line,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
